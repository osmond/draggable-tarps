# Jon Osmond Draggable Tarps

This project powers [jonosmond.com](https://jonosmond.com), showcasing AI generated images of Jon Osmond wearing various shirts ("tarps"). Visitors can drag each shirt onto the center image to preview how it looks.

## Development

1. Install dependencies with `npm install`. There are currently no external
   packages, but this step prepares the project for future additions.
2. Run the test suite with `npm test`.
3. Launch the site with `npm start`, which runs a lightweight static server,
   and open the served `index.html` in your browser.

All JavaScript is written in vanilla ES modules.

The GitHub Actions workflow runs `npm install` and `npm test` on every push and
pull request to ensure the site continues to build successfully.

## Keyboard Controls

Each shirt image can be focused with the Tab key. Press **Space** or **Enter** to grab the
focused shirt. While a shirt is grabbed, use the arrow keys to move it around
the page. Press **Space** or **Enter** again to drop the shirt and, if it is
over the center image, try it on.


## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
