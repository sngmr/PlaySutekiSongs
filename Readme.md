PlaySutekiSongs
===============

What's that?
------------
This is a Facebook Application made by Sinatra Ruby and some JavaScript to auto play Youtube music video from feeds by 'とっても素敵なグループ'.
<<<<<<< HEAD

=======
>>>>>>> 5c87ac9522546f55f69e3d12aabbc49a849da5b9
これは’とっても素敵なグループ’に投稿されたYoutubeリンクを自動再生するFacebookアプリケーションです。Sinatra, RubyとJavaScriptでできています。

Where is it from?
-----------------
https://www.facebook.com/groups/331943460187050/

How To Run?
===========

Run locally
-----------

Install dependencies:

    bundle install

[Create an app on Facebook](https://developers.facebook.com/apps) and set the Website URL to `http://localhost:5000/`.

Copy the App ID and Secret from the Facebook app settings page into your `.env`:

    echo FACEBOOK_APP_ID=12345 >> .env
    echo FACEBOOK_SECRET=abcde >> .env

Launch the app with [Foreman](http://blog.daviddollar.org/2011/05/06/introducing-foreman.html):

    foreman start

Foreman is not reload when apply change JavaScript sources, so I made little bit of code to re-start foreman automatically by Guard. Run by command below, and close terminal if you want to stop automatically procedure.

	./server.sh

Deploy to Heroku via Facebook integration
-----------------------------------------

The easiest way to deploy is to create an app on Facebook and click Cloud Services -> Get Started, then choose Ruby from the dropdown.  You can then `git clone` the resulting app from Heroku.

Deploy to Heroku directly
-------------------------

If you prefer to deploy yourself, push this code to a new Heroku app on the Cedar stack, then copy the App ID and Secret into your config vars:

    heroku create --stack cedar
    git push heroku master
    heroku config:add FACEBOOK_APP_ID=12345 FACEBOOK_SECRET=abcde

Enter the URL for your Heroku app into the Website URL section of the Facebook app settings page, then you can visit your app on the web.

