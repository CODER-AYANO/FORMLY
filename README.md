<h1 align="center">🖊️📄 Formly</h1>

<p align="center">
  <img src="images/icon.jpeg" alt="Formly" width="120">
</p>

<h3 align="center">AI-powered form automation for the web.</h3>

<p align="center">
  Formly understands web forms and intelligently generates relevant answers using Google Gemini.
</p>

---

## ✨ Features

* 🤖 **AI-powered form filling** — Understands questions and generates contextual responses.
* 🧠 **Context-aware answers** — Uses your personal information to provide relevant responses.
* ⚡ **Automatic field detection** — Detects and processes form fields directly on webpages.
* 🔐 **Local personal details** — Keep your personal information in your local configuration.
* 🌐 **Chrome Extension** — Works directly inside your browser.
* 🧩 **Gemini-powered** — Uses Google's Gemini API for intelligent responses.

---

## 📁 Project Structure

```text
Formly/
├── images/
│   └── icon.png
|   └── icon128.png
|   └── icon16.png
|   └── icon48.png
|
├── content.js
├── gemini.js
├── manifest.json
├── popup.html
├── popup.js
├── profile.json
├── README.md

---

# 🚀 How to Use

## 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/Formly.git
cd Formly
```

---

## 2. Add Your Gemini API Key

Formly uses the **Google Gemini API** to understand form questions and generate answers.

Create the required configuration file and add your Gemini API key:

```text
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

⚠️ Replace `YOUR_GEMINI_API_KEY` with your actual API key.

You can get a Gemini API key from **Google AI Studio**.

---

## 3. Add Your Personal Details

Formly can use your personal information to generate more relevant responses.

Edit the personal details file:

```text
└── profile.json
```

Example:

```json
{
    "name": "",
    "roll_number": "",
    "registration_number": "",
    "section": "",
    "branch": "",
    "degree": "",
    "semester": "",
    "year_range": "",
    "current_year": "",
    "email": "",
    "phone": "",
    "notes": "any additional details?(leave it blank otherwise)"
}
```

Add or remove fields according to the information you want Formly to use.

---

# 🧩 Install the Extension

1. Open Chrome.
2. Go to:

```text
chrome://extensions/
```

3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the Formly project directory.
6. Formly should now appear in your installed extensions.

---

# 💡 Using Formly

1. Open a webpage containing a form.
2. Click the **Formly** extension icon.
3. Make sure your Gemini API key is configured.
4. Make sure your personal details are configured.
5. Click 'Fill Form'.
6. Review the generated answers.
7. Fill or submit the form according to your workflow.

> **Always review AI-generated responses before submitting a form.**

---

# 📌 Roadmap

* [ ] Improved form/question detection
* [ ] Better contextual answer generation
* [ ] Support for more form types
* [ ] Custom user profiles
* [ ] Answer history
* [ ] Improved UI
* [ ] More AI providers
* [ ] Advanced field validation
