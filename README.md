# Jon Osmond Draggable Tarps

This project powers [jonosmond.com](https://jonosmond.com), showcasing AI generated images of Jon Osmond wearing various shirts ("tarps"). Visitors can drag each shirt onto the center image to preview how it looks.

## Development

1. Install dependencies with `npm install`.
2. Start the local server with `npm start` (or `node server.js`).
   The site will be available at `http://localhost:3000` and also handles
   form submissions.

All JavaScript is written in vanilla ES modules.

## Suggest a Shirt

`index.html` contains a form that posts to the `/suggest` endpoint served by
`server.js`.  The server uses `nodemailer` to forward submissions to the address
specified in the `TARGET_EMAIL` environment variable (falling back to
`SMTP_USER`).  Configure your SMTP credentials via the `SMTP_HOST`, `SMTP_PORT`,
`SMTP_USER`, and `SMTP_PASS` environment variables.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
