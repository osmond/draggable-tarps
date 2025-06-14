# Jon Osmond Draggable Tarps

This project powers [jonosmond.com](https://jonosmond.com), showcasing AI generated images of Jon Osmond wearing various shirts ("tarps"). Visitors can drag each shirt onto the center image to preview how it looks.

## Development

This project targets **Node.js 20**. Run `nvm use` to switch to this version.

1. Install dependencies with `npm install` (requires a local installation of
   Node.js and npm for offline use).
2. Install the browsers needed for Playwright tests with `npx playwright install`.
3. Run the test suite with `npm test`.
4. Launch the site with `npm start`. This runs the locally installed `serve`
   package, which starts a lightweight static server on
   [http://localhost:3000](http://localhost:3000) by default. Open the served
   `index.html` in your browser.
5. Optionally add a sound effect by placing an MP3 named `first-drop.mp3` in the
   `assets/` directory. It will play the first time a shirt is placed on the
   model during a session.

6. Optionally include another MP3 named `cheese.mp3` in the `assets/` directory.
   It will play whenever the suit shirt is placed on the model.


7. During local development (running on localhost or when `NODE_ENV` is not
   `production`), the favicon switches to `assets/favicon-dev.svg` so browser
   tabs are easily distinguished from production.



All JavaScript is written in vanilla ES modules.

The GitHub Actions workflow runs `npm install` and `npm test` on every push and
pull request to ensure the site continues to build successfully.

## Keyboard Controls

Each shirt image can be focused with the Tab key. Press **Space** or **Enter** to grab the
focused shirt. While a shirt is grabbed, use the arrow keys to move it around
the page. Press **Space** or **Enter** again to drop the shirt and, if it is
over the center image, try it on.

## Suggesting Shirts

Click the **Suggest a shirt** button in the top corner to share ideas for new designs.

Suggestions are saved in your browser's local storage so they appear again the next
time you visit the page. When they reappear you'll see a message like
"Do you see <your shirt idea>? If not, send me an [email](mailto:jonathan.osmond@gmail.com) and I'll be sure to add it!"
prompting you to contact me if your idea hasn't been added yet.



## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
