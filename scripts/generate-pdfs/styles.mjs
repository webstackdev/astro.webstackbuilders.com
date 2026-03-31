export const buildTemplateStyles = () => {
  return `<style>
    * {
      box-sizing: border-box;
    }

    body {
      font-family: "Onest Regular", Arial, Helvetica, sans-serif;
      margin: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      width: 100%;
    }

    /**
     * PDF Header Styles
     */

    .pdf-header {
      background-color: #E5E7EB !important;
      box-sizing: border-box;
      display: flex;
      min-height: 2cm;
      justify-content: space-between;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      padding: 0.45cm 2cm 0.35cm;
      width: 100%;
    }

    /**
     * Brand is the company logo and wordmark elements that appear in the header
     */

    .pdf-brand {
      align-items: center;
      display: flex;
      min-width: 0;
    }

    /**
     * Company logo
     */

    .pdf-brand__logo {
      display: inline-flex;
      flex: 0 0 auto;
      height: 30px;
      width: 30px;
    }

    .pdf-brand__logo .logo {
      display: block;
      height: 100%;
      width: 100%;
    }

    .pdf-brand__logo .logo-block-outer {
      fill: #001A39;
    }

    .pdf-brand__logo .logo-block-inner {
      fill: #006dca;
    }

    /**
     * Wordmark with the company name as SVG paths
     */

    .pdf-brand__wordmarks {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-left: 8px;
      min-width: 0;
    }

    .pdf-brand__wordmark-row {
      display: block;
      height: 12px;
    }

    .pdf-brand__wordmark-row .wordmark__svg {
      display: block;
      height: 100%;
      width: auto;
    }

    .pdf-brand__wordmark-row .wordmark__svg-path {
      fill: #001A39;
    }

    /**
     * Article title on the right of the header
     */

    .pdf-header__title {
      color: #001A39;
      flex: 1 1 auto;
      font-size: 12pt;
      font-weight: 700;
      line-height: 1.1;
      max-width: 60%;
      margin: 0;
      text-align: right;
    }

    /**
     * PDF Footer Styles
     */

    .pdf-footer {
      align-items: center;
      background-color: #003d86 !important;
      box-sizing: border-box;
      color: #fff;
      display: flex;
      gap: 12px;
      justify-content: space-between;
      min-height: 2.5cm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      padding: 0.35cm 2cm 0.45cm;
      width: 100%;
    }

    /**
     * Left column has avatar and company address
     */

    .pdf-layout-footer__left {
      display: flex;
      flex-direction: column;
      flex: 1 1 0;
      gap: 4px;
      justify-content: center;
      min-width: 0;
    }

    .pdf-layout-footer__avatar {
      align-items: center;
      display: flex;
      flex: 0 0 auto;
      gap: 8px;
      justify-content: flex-start;
      min-width: 0;
      width: 100%;
    }

    .pdf-layout-footer__avatar-img {
      border-radius: 9999px;
      display: block;
      height: 100%;
      height: 32px;
      object-fit: cover;
      width: 100%;
      width: 32px;
    }

    .pdf-layout-footer__company-name {
      color: #fff;
      font-size: 12pt;
      font-weight: 700;
      line-height: 1.1;
      margin: 0;
    }

    .pdf-layout-footer__address,
    .pdf-layout-footer__right {
      font-size: 10pt;
      font-style: normal;
      line-height: 1.2;
      margin: 0;
      min-width: 0;
    }

    .pdf-layout-footer__address {
      display: flex;
      flex-direction: column;
      gap: 2px;
      justify-content: center;
      width: 100%;
    }

    .pdf-layout-footer__address p,
    .pdf-layout-footer__right p {
      font-size: 10pt;
      margin: 0;
    }

    /**
     * Center column has page numbers
     */

    .pdf-layout-footer__center {
      align-items: center;
      color: #fff;
      display: flex;
      flex: 0 0 auto;
      font-size: 10pt;
      justify-content: center;
      line-height: 1.1;
      margin: 0;
      text-align: center;
    }

    /**
     * Right column has phone numbers and email address
     */

    .pdf-layout-footer__right {
      align-items: center;
      color: #fff;
      display: flex;
      flex-direction: column;
      flex: 1 1 0;
      font-size: 12pt;
      gap: 2px;
      justify-content: flex-end;
      text-align: right;
    }

    .pdf-layout-footer__right a,
    .pdf-layout-footer__right p {
      color: #fff;
      text-decoration: none;
    }
  </style>`
}
