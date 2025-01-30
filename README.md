# AO3 Bookmark Downloader

A Puppeteer-based script to automate downloading **EPUB** files from your AO3 (Archive of Our Own) bookmarks. The saved files are in this format: **ficTitle_relationship.epub**

## Features

- Logs into AO3 manually

- Retrieves all bookmarks

- Downloads **EPUB** files for each bookmarked fic

- Renames files using the fic title and relationship tags

## Prerequisites

- Ensure you have the following installed on your system:

- Node.js (version 16+ recommended)

- npm (comes with Node.js)

- A code editor like Visual Studio Code

- Make sure you have saved the **fics** and not the **series** in the bookmarks in your AO3 account.

## Installation

- Clone the repository:

  `git clone https://github.com/n2n0n00/ao3multidownloader.git`
  
  `cd ao3multidownloader`

## Install dependencies:

       npm install

## Configuration

- Update the script with your AO3 bookmarks URL:

- Open index.js (or the main script file) in your code editor.

- Find the following line:

  `const BOOKMARKS_URL = "https://archiveofourown.org/users/your_username/bookmarks";`

- Replace your_username with your AO3 username or provide the direct URL to your bookmarks.

## Usage

- Run the script with:

  `node index.js`

## Steps:

- The script will launch a browser and open AO3.

- Manually log in to your AO3 account.

- Once logged in, press Enter in the terminal.

- The script will collect all bookmarked fics and download their **EPUB** files.

- Downloads will be saved in a **downloads** folder that the script creates in the same folder that it is installed.

## Troubleshooting

- If the script fails to find bookmarks, ensure your AO3 bookmarks are public or that you are logged in.

- If downloads are not completing, ensure your browser allows file downloads in headless mode.

- If filenames are incorrect, check the script’s renaming logic in index.js.

## License

MIT

### Note: If you need a pdf version, reach out to me here: athena.tz.dev@gmail.com
