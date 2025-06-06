[Read the documentation in Italian](README_it.md)

<picture>
  <source srcset="/docs/static/logo_white.svg" media="(prefers-color-scheme: dark)">
  <source srcset="/docs/static/logo_black.svg" media="(prefers-color-scheme: light)">
  <img src="/docs/static/logo_white.svg" alt="Logo">
</picture>

**Proof & Dragons** is an interactive web application designed as a companion app for the educational game of the same name. Through various playful metaphors, users can experience in a simplified way how miners compete to add blocks to a blockchain.

## Educational context

This project was developed as an educational resource for high school students (ages 15-18) to illustrate:

* The basic principles of Proof-of-Work.
* How mining difficulty and the nonce affect block creation.
* The structure of a blockchain (the Timewall).
* The concept of a "mempool" and transaction selection (in a simplified manner).

The goal is to provide a practical and interactive understanding of concepts that may seem abstract, sparking curiosity about Bitcoin.

A [game manual (in Italian)](https://rainbowbits.cloud/proof_and_dragons/manuale.html) is available for teachers, explaining how to use the application and integrate the game into their teaching activities.

<div align="center">
  <a href="https://rainbowbits.cloud/proof_and_dragons/manuale.html" target="_blank" style="
    display: inline-block;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: bold;
    color: white;
    background-color: #4F46E5;
    border-radius: 8px;
    text-decoration: none;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: background-color 0.3s ease;
  " onmouseover="this.style.backgroundColor='#3730A3'" onmouseout="this.style.backgroundColor='#4F46E5'">
    Go to the Game Manual (Italian)
  </a>
</div>

## Main features

The application is used by the teacher or facilitator to automatically verify students' calculations during the "Proof & Dragons" game and provide visual feedback on what is happening during the match. Key features include:

* **Mining process visualization:** The teacher inputs the group's name ("Pool Name") and the nonce to validate a mining attempt.
* **Dynamic difficulty adjustment:**
    * **Initial difficulty:** Set at the beginning of the game based on the number of participating groups.
    * **Time-based adjustment:** After a block is mined, the difficulty for the next round is automatically adjusted based on the time taken, with the goal of keeping the block time around 5 minutes.
* **Proof calculation:** A simplified formula calculates a "Proof" value based on the pool name, nonce, the remainder of the previous block (if any), and, for the final block, the value of selected transactions.
* **Remainder verification:** The "Proof" is divided by a chosen divisor. If the remainder is greater than or equal to a target threshold (`divisor - 3`), the block is considered "mined".
* **Timewall (Blockchain):** Successfully mined blocks are added to the "Timewall," showing the details of each block.
* **Simplified Mempool:** For the third block, users can select up to two "transactions" from the mempool, whose value (the length of their description) contributes to the Proof calculation.
* **Calculation details:** Each step of the calculation for verifying a mining attempt is displayed in real-time.
* **Internationalization (i18n):** The interface supports multiple languages (Italian, English, Spanish) with a language selector, and the structure is ready to easily add more.
* **Light/Dark Theme:** Ability to switch themes for a better viewing experience.
* **Responsive Design:** The interface adapts to different screen sizes but is primarily designed for use on TVs and large monitors. Fullscreen mode can be activated by pressing the `F` key.

## How to run the project

### Online
The app is available online on the [Rainbow Bits](https://rainbowbits.cloud/proof_and_dragons/) website.

### Locally
1.  **Clone the repository (or download the files):**
    ```bash
    git clone [https://github.com/marcofarina/proof_and_dragons.git](https://github.com/marcofarina/proof_and_dragons.git)
    cd proof_and_dragons
    ```
    Alternatively, if you are not familiar with Git, you can download the project as a ZIP file from GitHub and unzip it into a folder of your choice.
2.  **Open `index.html` in your browser:**
    Double-click the `index.html` file or open it via the "File > Open" menu of your favorite web browser (e.g., Chrome, Firefox, Edge, Safari).

No dependency installation or build process is required, as Tailwind CSS is loaded via a CDN and the JavaScript code is vanilla.

## Contributions

Contributions are welcome! If you have ideas for improving the project, open an issue or submit a pull request.

Some areas for improvement:
* **Add more languages:** Thanks to the new i18n system, adding a new language is as simple as creating a new folder in `docs/locales`, adding the translated `common.json` and `index.json` files, and updating the `locales-manifest.json` file.
* **Translate the manual:** The `manuale.html` page is currently only in Italian. It could be translated and integrated into the i18n system.
* **Save game state:** Use `localStorage` to save the game state, allowing the user to resume it later.
* **More complex animations:** Enhance CSS animations or introduce JavaScript animations to make the experience more engaging.

## License

This project is distributed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)** license.

You are free to **copy, distribute, remix, and reuse** the material, **under the following terms**:

-   **Attribution**: You must give appropriate credit to the original author.
-   **NonCommercial**: You may not use the material for commercial purposes.
-   **ShareAlike**: If you remix, transform, or build upon the material, you must distribute your contributions under the **same license**.

More info: [creativecommons.org/licenses/by-nc-sa/4.0](https://creativecommons.org/licenses/by-nc-sa/4.0)

<div align="center">
  <a rel="license" href="https://creativecommons.org/licenses/by-nc-sa/4.0/">
    <img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" />
  </a>
</div>