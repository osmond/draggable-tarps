# Jon Osmond Draggable Tarps

This project powers [jonosmond.com](https://jonosmond.com), showcasing AI generated images of Jon Osmond wearing various shirts ("tarps"). Visitors can drag each shirt onto the center image to preview how it looks.

## Development

This project targets **Node.js 20**. Run `nvm use` to switch to this version.

1. Install dependencies with `npm install`. This also installs the browsers
   needed for Playwright tests.
2. Run the test suite with `npm test`.
3. Launch the site with `npm start`. This starts the `server.js` script which
   only serves static files on [http://localhost:3000](http://localhost:3000). Open the served `index.html` in your browser.
4. Optionally add a sound effect by placing an MP3 named `first-drop.mp3` in the
   `assets/` directory. It will play the first time a shirt is placed on the
   model during a session.

5. Optionally include another MP3 named `cheese.mp3` in the `assets/` directory.
   It will play whenever the suit shirt is placed on the model.


6. During local development (running on `localhost`, `127.0.0.1`, or when
   `NODE_ENV` is not `production`), the favicon switches to
   `assets/favicon-dev.svg` so browser tabs are easily distinguished from
   production.



All JavaScript is written in vanilla ES modules.

The GitHub Actions workflow runs `npm install` and `npm test` on every push and
pull request to ensure the site continues to build successfully.

## Keyboard Controls

Each shirt image can be focused with the Tab key. Press **Space** or **Enter** to grab the
focused shirt. While a shirt is grabbed, use the arrow keys to move it around
the page. Press **Space** or **Enter** again to drop the shirt and, if it is
over the center image, try it on.

## Suggesting Shirts

Click the **Suggest a shirt** button in the top corner to share ideas for new designs. Shirt ideas are stored in your browser's localStorage and sent to Firebase so they appear for everyone.
Each item in the **Shirt Suggestions** list now includes a small `×` button.
Click it to remove that suggestion from the list. This deletes it from your
local storage and also removes it from the shared list for everyone.

When you share an idea you'll see a message like "That's a great idea! I would
love to see him wearing <your shirt idea>!"

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
