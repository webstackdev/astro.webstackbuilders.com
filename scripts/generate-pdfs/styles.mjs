export const buildTemplateStyles = () => {
  return `<style>
    html,
    * {
      box-sizing: border-box;
    }

    html,
    body {
      font-family: "Onest Regular", Arial, Helvetica, sans-serif;
      height: 100%;
      margin: 0;
      overflow: hidden;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      width: 100%;
    }

    /**
     * Do not remove, to stretch header and footer to top and bottom of page respectively
     */
    #header, #footer { padding: 0 !important; }

    /**
     * PDF Header Styles
     */

    .pdf-header {
      background-color: #E5E7EB !important;
      box-sizing: border-box;
      height: 1.5cm;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      width: 100% !important;
    }

    .pdf-header__inner {
      align-items: center;
      display: flex;
      height: 100%;
      justify-content: space-between;
      padding: 0 1cm;
      width: 100% !important;
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
      font-size: 14pt;
      font-weight: 700;
      line-height: 1.1;
      text-align: right;
    }

    /**
     * PDF Footer Styles
     */

    .pdf-footer {
      background-color: #001A39 !important;
      box-sizing: border-box;
      color: #fff;
      height: 100%;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      width: 100% !important;
      border: #6b7280 1px solid;
    }

    .pdf-footer__inner {
      align-items: center;
      display: flex;
      gap: 12px;
      height: 100%;
      justify-content: space-between;
      padding: 0.2cm;
      width: 100% !important;
      border: #6b7280 1px solid;
    }

    /**
     * Left column has avatar and company address
     */

    .pdf-layout-footer__left {
      display: flex;
      gap: 4px;
      border: #6b7280 1px solid;
    }

    .pdf-layout-footer__avatar {
      align-items: center;
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

    .pdf-layout-footer__address {
      display: flex;
      flex-direction: column;
      gap: 2px;
      justify-content: center;
      width: 100%;
      margin: 0;
      min-width: 0;
    }

    .pdf-layout-footer__company-name {
      color: #6b7280;
      font-size: 12pt;
      font-style: normal;
      font-weight: 700;
      line-height: 1.1;
      margin: 0;
    }


    .pdf-layout-footer__address p {
      color: #6b7280;
      font-size: 10pt;
      font-style: normal;
      font-weight: 700;
      line-height: 1.1;
      margin: 0;
    }

    /**
     * Center column has page numbers
     */

    .pdf-layout-footer__center {
      align-items: center;
      color: #6b7280;
      display: flex;
      flex: 0 0 auto;
      font-size: 10pt;
      justify-content: center;
      line-height: 1.1;
      margin: 0;
      text-align: center;
      border: #6b7280 1px solid;
    }

    /**
     * Right column has phone numbers and email address
     */

    .pdf-layout-footer__right {
      align-items: center;
      display: flex;
      flex-direction: column;
      flex: 1 1 0;
      gap: 2px;
      justify-content: flex-end;
      text-align: right;
      margin: 0;
      min-width: 0;
      border: #6b7280 1px solid;
    }

    .pdf-layout-footer__right p {
      color: #6b7280;
      font-size: 10pt;
      font-style: normal;
      line-height: 1.2;
    }
  </style>`
}
