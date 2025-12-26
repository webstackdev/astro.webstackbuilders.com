from __future__ import annotations

import os
import logging
import socket
import ssl
import traceback
import urllib.parse
from base64 import b64encode

from actions_toolkit import core
from libsql_client import create_client_sync


def _is_debug_enabled() -> bool:
    value = (os.environ.get("DEBUG") or "").strip().lower()
    return value in {"1", "true", "yes", "on"}


def _debug_log(message: str) -> None:
    if not _is_debug_enabled():
        return

    # `core.debug()` messages are only shown when GitHub's step debug logging is
    # enabled. For local `act` runs, we want this output unconditionally when
    # DEBUG=1, so we always emit an info log too.
    core.info(message)

    debug_fn = getattr(core, "debug", None)
    if callable(debug_fn):
        debug_fn(message)


def _enable_verbose_logging() -> None:
    if not _is_debug_enabled():
        return

    # libsql-client uses aiohttp under the hood. Enable Python logging so any
    # available debug logs become visible during local troubleshooting.
    logging.basicConfig(level=logging.DEBUG)
    logging.getLogger("aiohttp").setLevel(logging.DEBUG)
    logging.getLogger("libsql_client").setLevel(logging.DEBUG)


def _host_and_port_from_url(url: str) -> tuple[str, int]:
    parsed = urllib.parse.urlparse(url)
    host = parsed.hostname or ""
    if not host:
        raise ValueError("URL does not contain a hostname")
    return host, parsed.port or 443


def _read_http_response_head(sock_obj: ssl.SSLSocket, *, max_bytes: int = 4096) -> str:
    data = sock_obj.recv(max_bytes)
    return data.decode("utf-8", errors="replace")


def _summarize_http_response(raw: str) -> tuple[str, list[str], str]:
    # Returns: status line, selected headers, body snippet
    if not raw:
        return "", [], ""

    header_text, _, body = raw.partition("\r\n\r\n")
    header_lines = [line.strip() for line in header_text.splitlines() if line.strip()]
    status_line = header_lines[0] if header_lines else ""

    wanted = {"server", "via", "date", "content-type", "content-length", "cf-ray", "x-request-id"}
    selected: list[str] = []
    for line in header_lines[1:]:
        if ":" not in line:
            continue
        name, value = line.split(":", 1)
        if name.strip().lower() in wanted:
            selected.append(f"{name.strip()}: {value.strip()}")

    body_snippet = body[:200].replace("\n", "\\n").replace("\r", "")
    return status_line, selected, body_snippet


def _debug_network_diagnostics(url: str) -> None:
    if not _is_debug_enabled():
        return

    host, port = _host_and_port_from_url(url)
    _debug_log(f"[keep-alive] diagnostics host={host} port={port}")

    try:
        addrs = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
        unique = sorted({item[4][0] for item in addrs})
        _debug_log(f"[keep-alive] diagnostics dns={unique}")
    except Exception as exc:  # noqa: BLE001
        _debug_log(f"[keep-alive] diagnostics dns_error={type(exc).__name__} {exc!r}")
        unique = []

    context = ssl.create_default_context()
    # Best-effort: many endpoints negotiate h2; log what we get.
    context.set_alpn_protocols(["h2", "http/1.1"])

    def _connect_tls() -> ssl.SSLSocket:
        raw = socket.create_connection((host, port), timeout=5)
        return context.wrap_socket(raw, server_hostname=host)

    try:
        with _connect_tls() as tls_sock:
            tls_sock.settimeout(5)
            _debug_log(
                "[keep-alive] diagnostics tls="
                f"{tls_sock.version()} alpn={tls_sock.selected_alpn_protocol()} cipher={tls_sock.cipher()}"
            )

            # Basic HTTPS probe. Useful when a proxy/WAF is returning an error page.
            tls_sock.sendall(
                (
                    "GET / HTTP/1.1\r\n"
                    f"Host: {host}\r\n"
                    "User-Agent: keep-alive-debug\r\n"
                    "Connection: close\r\n"
                    "\r\n"
                ).encode("utf-8")
            )
            head = _read_http_response_head(tls_sock)
            status_line, headers, body_snippet = _summarize_http_response(head)
            _debug_log(f"[keep-alive] diagnostics https_status={status_line!r}")
            if headers:
                _debug_log(f"[keep-alive] diagnostics https_headers={headers!r}")
            if body_snippet:
                _debug_log(f"[keep-alive] diagnostics https_body_snippet={body_snippet!r}")
    except Exception as exc:  # noqa: BLE001
        _debug_log(f"[keep-alive] diagnostics https_error={type(exc).__name__} {exc!r}")

    # Minimal WebSocket handshake probe against `/`.
    # Turso/libsql uses Hrana over WebSockets; some infra rejects WS upgrades.
    try:
        with _connect_tls() as ws_sock:
            ws_sock.settimeout(5)
            ws_key = b64encode(os.urandom(16)).decode("ascii")
            ws_sock.sendall(
                (
                    "GET / HTTP/1.1\r\n"
                    f"Host: {host}\r\n"
                    "Upgrade: websocket\r\n"
                    "Connection: Upgrade\r\n"
                    f"Sec-WebSocket-Key: {ws_key}\r\n"
                    "Sec-WebSocket-Version: 13\r\n"
                    "Sec-WebSocket-Protocol: hrana1\r\n"
                    "User-Agent: keep-alive-debug\r\n"
                    "\r\n"
                ).encode("utf-8")
            )
            head = _read_http_response_head(ws_sock)
            status_line, headers, body_snippet = _summarize_http_response(head)
            _debug_log(f"[keep-alive] diagnostics ws_status={status_line!r}")
            if headers:
                _debug_log(f"[keep-alive] diagnostics ws_headers={headers!r}")
            if body_snippet:
                _debug_log(f"[keep-alive] diagnostics ws_body_snippet={body_snippet!r}")
    except Exception as exc:  # noqa: BLE001
        _debug_log(f"[keep-alive] diagnostics ws_error={type(exc).__name__} {exc!r}")


def _create_client_kwargs(*, url: str, auth_token: str) -> dict[str, object]:
    """Build kwargs for libsql_client.create_client_sync.

    The library API can differ by version; we probe the function signature and
    enable verbosity only when the installed version supports it.
    """

    kwargs: dict[str, object] = {"url": url, "auth_token": auth_token}
    if not _is_debug_enabled():
        return kwargs

    # No explicit verbose mode is documented for libsql-client (and the exposed
    # signature is permissive), so we rely on Python logging above.
    # Keep this function to centralize any future client knobs.
    return kwargs

def get_required_value(value: str, label: str) -> str:
    trimmed = value.strip()
    if not trimmed:
        raise ValueError(f"Missing {label}")
    return trimmed


def normalize_libsql_url(url: str) -> str:
    parsed = urllib.parse.urlparse(url)

    # libsql-client transforms libsql:// URLs into ws(s):// for Hrana WebSockets.
    # When the path is empty, some servers reject the handshake for `wss://host`
    # (no trailing slash). Normalize to `.../`.
    if parsed.scheme == "libsql" and parsed.netloc and parsed.path == "":
        parsed = parsed._replace(path="/")
        return urllib.parse.urlunparse(parsed)

    return url


def _to_https_url(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    # Keep authority + path; drop query/fragment to avoid url-embedded authToken.
    path = parsed.path or "/"
    return urllib.parse.urlunparse(("https", parsed.netloc, path, "", "", ""))


def _looks_like_websocket_unsupported_error(exc: BaseException) -> bool:
    status = getattr(exc, "status", None)
    if status == 505:
        return True
    message = f"{exc!s}"
    if "WebSocket connections are not supported" in message:
        return True
    if exc.__class__.__name__ == "WSServerHandshakeError" and status is not None:
        return True
    return False


def _execute_select_1(*, url: str, auth_token: str) -> None:
    client = create_client_sync(**_create_client_kwargs(url=url, auth_token=auth_token))
    try:
        client.execute("SELECT 1")
    finally:
        client.close()


def run() -> None:
    try:
        if _is_debug_enabled():
            core.info("[keep-alive] In debug mode")

        url = core.get_input("url", required=True)
        auth_token = core.get_input("token", required=True)

        required_url = normalize_libsql_url(get_required_value(url, "url"))
        required_auth_token = get_required_value(auth_token, "token")

        _enable_verbose_logging()
        _debug_log(f"[keep-alive] required_url={required_url}")
        _debug_network_diagnostics(required_url)

        succeeded_url = required_url

        try:
            _execute_select_1(url=required_url, auth_token=required_auth_token)
        except Exception as exc:  # noqa: BLE001
            scheme = urllib.parse.urlparse(required_url).scheme
            if scheme in {"libsql", "ws", "wss"} and _looks_like_websocket_unsupported_error(exc):
                https_url = _to_https_url(required_url)
                _debug_log(
                    "[keep-alive] WebSocket transport appears unsupported; "
                    f"retrying using HTTPS transport url={https_url}"
                )
                _execute_select_1(url=https_url, auth_token=required_auth_token)
                succeeded_url = https_url
            else:
                raise

        if _is_debug_enabled():
            core.info(f"[keep-alive] succeeded_transport={urllib.parse.urlparse(succeeded_url).scheme}")

        core.info("[keep-alive] OK")
    except Exception as exc:  # noqa: BLE001
        _debug_log(f"[keep-alive] error_type={type(exc).__name__} error={exc!r}")
        if _is_debug_enabled():
            _debug_log(traceback.format_exc())
        core.set_failed(str(exc))


if __name__ == "__main__":
    run()
