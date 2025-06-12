# Jon Osmond Draggable Tarps

This project powers [jonosmond.com](https://jonosmond.com), showcasing AI generated images of Jon Osmond wearing various shirts ("tarps"). Visitors can drag each shirt onto the center image to preview how it looks.

## Development

1. Install dependencies with `npm install`. There are currently no external
   packages, but this step prepares the project for future additions.
2. Run the test suite with `npm test`.
3. Start a static server (e.g. `npx serve`) in the project root and open the
   served `index.html` in your browser.

All JavaScript is written in vanilla ES modules.

The GitHub Actions workflow runs `npm install` and `npm test` on every push and
pull request to ensure the site continues to build successfully.


## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
