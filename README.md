# ⚡ Smart Electricity Bill Calculator

Welcome to the **Smart Electricity Bill Calculator**! This beautiful and feature-rich web application helps you calculate your electricity bills using Indian state slab rates, track monthly usage, predict future bills, and get personalized energy-saving tips.

## 🌟 Key Features

- **🧮 Bill Calculator**: Instantly calculate your electricity bill for major Indian states (Maharashtra, Delhi, Karnataka, Tamil Nadu, UP) for both residential and commercial consumer types.
- **📊 Usage Tracking**: Log your monthly energy consumption and view intuitive bar and line charts to track trends over time. 
- **📅 Year Formatting Improvement**: Reorganized and polished year formatting (e.g. "Oct 25") for easy reading across usage history and charts.
- **🔮 Future Prediction**: Use linear regression to predict next month's energy consumption and cost based on your historical data.
- **🔌 Appliance Manager**: Estimate how much power specific appliances consume (AC, Fridge, TV, etc.) and visually compare their monthly costs.
- **💡 Smart Tips**: Get tailored tips to save energy and reduce your carbon footprint based on your state and usage patterns.

## 🚀 Deployment Options

### 1. Static Web Hosting (Recommended)
This application is built with standard HTML, CSS, and Vanilla JavaScript. You can deploy it for free using:
- [GitHub Pages](https://pages.github.com/)
- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)

Simply upload the directory containing `index.html`, `style.css`, and `app.js` and your site is ready!

### 2. Streamlit Deployment
If you prefer to deploy using **Streamlit** (for example, on Streamlit Community Cloud), a simple wrapper `app.py` has been included in this project. 

**Steps to run on Streamlit Locally:**
1. Make sure you have Streamlit installed:
   ```bash
   pip install streamlit
   ```
2. Run the provided Streamlit app:
   ```bash
   streamlit run app.py
   ```

**Steps to Deploy on Streamlit Cloud:**
1. Push this repository to GitHub.
2. Go to [Streamlit Community Cloud](https://share.streamlit.io/).
3. Create a new app and select your repository, branch, and set the main file path to `app.py`.
4. Click Deploy!

## 🛠️ Technology Stack
- **HTML5 & CSS3** (Vanilla CSS with dynamic styling and micro-animations)
- **Vanilla JavaScript** (Logic, localStorage data persistence)
- **Chart.js** (Beautiful data visualization)
- *(Optional) Streamlit (For simple Python-based serving)*

## 📂 Project Structure
- `index.html`: Main HTML structure.
- `style.css`: All the styling, animations, and beautiful gradients.
- `app.js`: Core logic for calculations, charts, usage history, and algorithms.
- `app.py`: Streamlit wrapper for easy deployment on the Streamlit platform.
- `README.md`: This documentation file.

---
*Created to help you master your energy consumption and save money!*
