import streamlit as st
import streamlit.components.v1 as components
import base64
import os

st.set_page_config(
    page_title="Smart Electricity Bill Calculator",
    page_icon="⚡",
    layout="wide"
)

# Hide Streamlit elements for a cleaner look
hide_st_style = """
            <style>
            #MainMenu {visibility: hidden;}
            footer {visibility: hidden;}
            header {visibility: hidden;}
            </style>
            """
st.markdown(hide_st_style, unsafe_allow_html=True)

# Read static files
def get_file_content(file_name):
    with open(file_name, "r", encoding="utf-8") as f:
        return f.read()

# Load HTML, CSS, JS
html_content = get_file_content("index.html")
css_content = get_file_content("style.css")
js_content = get_file_content("app.js")

# We need to inject the CSS and JS into the HTML
# Replace <link rel="stylesheet" href="style.css"> with inline CSS
html_content = html_content.replace(
    '<link rel="stylesheet" href="style.css">',
    f'<style>{css_content}</style>'
)

# Find where to inject JS (before </body>)
# Or we can just append a script tag
html_content = html_content.replace(
    '</body>',
    f'<script>{js_content}</script></body>'
)

# Render the application
components.html(html_content, height=1200, scrolling=True)
