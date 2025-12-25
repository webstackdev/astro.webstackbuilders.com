from __future__ import annotations

import os
import sys


def log_info(message: str) -> None:
    print(message)


def log_debug(message: str) -> None:
    print(f"::debug::{message}")


def log_warning(message: str) -> None:
    print(f"::warning::{message}")


def log_error(message: str) -> None:
    print(f"::error::{message}")


def add_mask(value: str) -> None:
    if value.strip():
        print(f"::add-mask::{value}")


def set_output(name: str, value: str) -> None:
    github_output = os.environ.get("GITHUB_OUTPUT")
    if github_output:
        with open(github_output, "a", encoding="utf-8") as handle:
            handle.write(f"{name}={value}\n")
        return

    # Fallback for older runners.
    print(f"::set-output name={name}::{value}")


def set_failed(message: str) -> None:
    log_error(message)
    sys.exit(1)
