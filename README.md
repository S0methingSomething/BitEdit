# BitEdit - MonetizationVars Editor

A web-based editor for viewing, modifying, and patching MonetizationVars files for BitLife.

[![Live Application](https://img.shields.io/badge/🌐_Live_App-Available-brightgreen)](https://s0methingsomething.github.io/BitEdit/)
[![License](https://img.shields.io/badge/License-GPL_v3.0-blue.svg)](LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/s0methingsomething/BitEdit)](https://github.com/s0methingsomething/BitEdit/issues)

## 🎯 Overview

BitEdit is a specialized web tool that allows you to decrypt, analyze, and modify MonetizationVars files from BitLife. Built entirely in the browser, it provides an intuitive interface for understanding game monetization configurations and simplifying common modifications like unlocking in-app purchases (IAPs).

**Key Benefits:**
- No installation required - runs entirely in your browser
- Simple drag-and-drop interface
- Automatic patching capabilities
- Educational insight into game monetization structures

## ✨ Features

### Core Functionality
- **🔓 Easy Decryption/Encryption**: Convert MonetizationVars files to readable JSON and back
- **📝 In-Browser JSON Editing**: Modify decrypted data directly in your browser
- **🎯 One-Click "Unlock All"**: Automatically set all boolean false values to true
- **🔑 Custom Cipher Support**: Advanced users can specify custom cipher keys

### Source Management
- **📥 Auto-Download**: Fetch original MonetizationVars from default or custom sources
- **🔗 Custom URL Support**: Load MonetizationVars from any raw file URL
- **⚡ Auto-Patch & Download**: One-click solution to fetch, patch, and download modified files
- **💾 Backup Options**: Download original, untouched files for safekeeping

## 🚀 Quick Start

1. **Visit the Live Application**: [BitEdit](https://s0methingsomething.github.io/BitEdit/)
2. **Choose your workflow**:
   - Have a MonetizationVars file? Use the decrypt/encrypt tabs
   - Need a file? Click "Don't have a MonetizationVars?" for auto-download options
3. **Make your modifications** using the JSON editor or "Unlock All" feature
4. **Download your patched file** and apply it to your game

## 📋 Detailed Usage Guide

### 🔓 Decrypting Files

1. Select the **"Decrypt File"** tab
2. Click **"Select 'MonetizationVars' File"** and choose your file
   - File must be named exactly `MonetizationVars` (no extension)
3. (Optional) Expand **"Advanced Options"** to set a custom cipher key
4. Click **"Start Decryption"** to view the JSON data

### 🔒 Encrypting JSON

1. Select the **"Encrypt JSON"** tab
2. Either:
   - Paste JSON data directly into the textarea, or
   - Click **"Select JSON File to Encrypt"** to load from a file
3. (Optional) Set a custom cipher key in **"Advanced Options"**
4. Process your JSON and download the encrypted MonetizationVars file

### 🌐 Using Source Manager

Access via the **"Don't have a MonetizationVars?"** button:

- **View Current Source**: Check the active download source and its status
- **Custom Source**: Set a custom raw file URL (e.g., from raw.githubusercontent.com)
- **Auto-Patch & Download**: Get a pre-patched file with one click
- **Download Original**: Get the clean, unmodified file from the default source

### ⚙️ Modification Options

After loading JSON data:
- **Direct Editing**: Modify variables directly in the JSON textarea
- **Unlock All Button**: Quick patch to set all boolean values to true
- **Export Options**:
  - Download encrypted MonetizationVars file
  - Copy JSON to clipboard
  - Download decrypted JSON file

## ⚠️ Important Considerations

> **Educational Use**: This tool is designed for educational and research purposes to understand game monetization structures.

**Before You Begin:**
- Always backup your original game files
- Understand the risks of modifying game files
- Use responsibly and in accordance with applicable terms of service
- The default cipher key is `com.wtfapps.apollo16` (customizable in Advanced Options)

## 🏗️ Technical Details

**Built With:**
- Pure JavaScript/HTML implementation
- Browser-based encryption/decryption
- No server-side processing required

**Default Configuration:**
- Cipher Key: `com.wtfapps.apollo16`
- File Format: Binary encrypted data ↔ JSON
- Processing: Client-side only for privacy

## 🙏 Acknowledgments

This project is a JavaScript/HTML reimplementation of [bitlife-edit](https://github.com/yntha/bitlife-edit) by [yntha](https://github.com/yntha). All original decryption/encryption logic credits go to the original author.

## 📜 License

Licensed under the [GNU General Public License v3.0](LICENSE) - same as the original project.

## 🔗 Links & Support

- **🌐 Live Application**: https://s0methingsomething.github.io/BitEdit/
- **📁 Source Code**: https://github.com/s0methingsomething/BitEdit
- **🐛 Report Issues**: https://github.com/s0methingsomething/BitEdit/issues
- **🎯 Original C# Project by yntha**: https://github.com/yntha/bitlife-edit

---

<div align="center">

**Made with AI** | [⭐ Star this project](https://github.com/s0methingsomething/BitEdit) if you find it useful!

</div>
