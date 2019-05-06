#!/usr/bin/python3
from flask import Flask, request, render_template, jsonify
import calculate_sent
import sys
app = Flask(__name__)

@app.route('/')
def index():
	return render_template('index.html')

@app.route('/_calculate')
def calculate():
	key = request.args.get('key')
	score = calculate_sent.main(key)
	return jsonify({'result':score})