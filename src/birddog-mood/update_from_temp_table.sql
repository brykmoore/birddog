/****** Script for SelectTopNRows command from SSMS  ******/
UPDATE birddog.dbo.full_tweets
SET birddog.dbo.full_tweets.bing_negative = birddog.dbo.tweet_moods.bing_negative,
birddog.dbo.full_tweets.bing_positive = birddog.dbo.tweet_moods.bing_positive,
birddog.dbo.full_tweets.D_Anger = birddog.dbo.tweet_moods.D_Anger,
birddog.dbo.full_tweets.D_Caring = birddog.dbo.tweet_moods.bing_negative,
birddog.dbo.full_tweets.D_Confusion = birddog.dbo.tweet_moods.bing_negative,
birddog.dbo.full_tweets.D_Depression = birddog.dbo.tweet_moods.bing_negative,
birddog.dbo.full_tweets.D_Fear = birddog.dbo.tweet_moods.bing_negative,
birddog.dbo.full_tweets.D_Happiness = birddog.dbo.tweet_moods.bing_negative,
birddog.dbo.full_tweets.D_Hurt = birddog.dbo.tweet_moods.bing_negative,
birddog.dbo.full_tweets.D_Inadequateness = birddog.dbo.tweet_moods.bing_negative,
birddog.dbo.full_tweets.D_Loneliness = birddog.dbo.tweet_moods.bing_negative,
birddog.dbo.full_tweets.D_Remorse = birddog.dbo.tweet_moods.bing_negative
  FROM birddog.dbo.full_tweets JOIN birddog.dbo.tweet_moods
  ON birddog.dbo.full_tweets.id = birddog.dbo.tweet_moods.id