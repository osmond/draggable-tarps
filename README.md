# Jon Osmond Draggable Tarps

This project powers [jonosmond.com](https://jonosmond.com), showcasing AI generated images of Jon Osmond wearing various shirts ("tarps"). Visitors can drag each shirt onto the center image to preview how it looks.

## Development

1. Run a static server (e.g. `npx serve`) in the project root.
2. Open the served `index.html` in your browser.

All JavaScript is written in vanilla ES modules.

## Enabling Form Submissions

The suggestion form can send entries to your email using a third-party service
like [Formspree](https://formspree.io/). To enable this:

1. Create a free Formspree account and set up a new form.
2. Copy the form's endpoint URL (it looks like `https://formspree.io/f/XXXXXX`).
3. Edit `index.html` and replace `YOUR_FORM_ID` in the form's `action` attribute
   with your endpoint ID.

Once configured, form submissions will be delivered to the email address you
registered with Formspree.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
