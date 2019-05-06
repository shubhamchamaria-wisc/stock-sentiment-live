#!/usr/bin/env python
import twitter
import sys
import re
import json
import itertools

def create_sent_dict(sentiment_file):

    scores = {}

    with open(sentiment_file) as f:
        line = f.readline()
        for line in f:
           (key, val) = line.split("\t")
           scores[key] = int(val)
    
    return scores

def get_tweet_sentiment(tweet, sent_scores):

    score = 0

    words = tweet.split();

    list = []

    for k in sent_scores.keys():
        if (re.search(r"\b" + re.escape(k) + r"\b", tweet)):
            list.append(k)

    list.sort(key=lambda x: len(x.split()), reverse=True)

    for word in list:
        if (re.search(r"\b" + re.escape(word) + r"\b", tweet)):
            tweet = tweet.replace(word,'')
            score = score + sent_scores.get(word)
    
    return score


def preprocess_word(word):

    word = word.strip('\'"?!,.():;')
    word = re.sub(r'(.)\1+', r'\1\1', word)
    word = re.sub(r'(-|\'|&)', '', word)
    return word


def is_valid_word(word):
    return (re.search(r'^[a-zA-Z][a-z0-9A-Z\._]*$', word) is not None)


def handle_emojis(tweet):
    tweet = re.sub(r'(:\s?\)|:-\)|\(\s?:|\(-:|:\'\))', ' EMO_POS ', tweet)
    tweet = re.sub(r'(:\s?D|:-D|x-?D|X-?D)', ' EMO_POS ', tweet)
    tweet = re.sub(r'(<3|:\*)', ' EMO_POS ', tweet)
    tweet = re.sub(r'(;-?\)|;-?D|\(-?;)', ' EMO_POS ', tweet)
    tweet = re.sub(r'(:\s?\(|:-\(|\)\s?:|\)-:)', ' EMO_NEG ', tweet)
    tweet = re.sub(r'(:,\(|:\'\(|:"\()', ' EMO_NEG ', tweet)
    return tweet


def preprocess_tweet(tweet):
    processed_tweet = []

    tweet = tweet.lower()
    tweet = re.sub(r'((www\.[\S]+)|(https?://[\S]+))', ' ', tweet)
    tweet = re.sub(r'@[\S]+', '', tweet)
    tweet = re.sub(r'#(\S+)', r'\1', tweet) 
    tweet = re.sub(r'^rt', '', tweet)
    tweet = re.sub(r'\.{2,}', ' ', tweet)
    tweet = tweet.strip(' \"\'')
    tweet = handle_emojis(tweet)
    tweet = re.sub(r'\s+', ' ', tweet)
    words = tweet.split()

    for word in words:
        word = preprocess_word(word)
        if is_valid_word(word):
            processed_tweet.append(word)

    return ' '.join(processed_tweet)

#Setting up Twitter API
api = twitter.Api(
 consumer_key='<insert-twitter-api-auth-here>',
 consumer_secret='<insert-twitter-api-auth-here>',
 access_token_key='<insert-twitter-api-auth-here>',
 access_token_secret='<insert-twitter-api-auth-here>'
 )

def store_recent(keyword):
    search = api.GetSearch(term='$'+keyword, lang='en', result_type='recent', count=100, max_id='')
    tweets = []
    for s in search:
        tweets.append(preprocess_tweet(s.text))
    return tweets

def main(keyword):
	tweets = store_recent(keyword)
	sentiment_file = "AFINN-111.txt"
	sent_scores = create_sent_dict(sentiment_file)
	final = 0
	for tweet in tweets:
		tmp = get_tweet_sentiment(tweet, sent_scores)
		final += tmp
	return final

if __name__ == '__main__':
    main()
