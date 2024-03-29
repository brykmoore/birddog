/****** Script for SelectTopNRows command from SSMS  ******/
SELECT
      q.[year]
      ,q.[month]
      ,q.[day]
      ,q.[hour]
      ,q.[minute]
      ,q.[symbol]
      ,[trade_price]
      ,[change]
      ,[change_in_percent]
      ,[average_daily_volume]
	  ,isnull(t.total_tweets, 0) as total_tweets
	  ,isnull( bing_positive_count, 0) as bing_positive_count
      ,isnull( t.bing_negative_count, 0) as bing_negative_count
      ,isnull( t.happiness_count, 0) as  happiness_count
      ,isnull( t.caring_count, 0) as  caring_count
      ,isnull( t.depression_count, 0) as  depression_count
      ,isnull( t.inadequateness_count, 0) as  inadequateness_count
      ,isnull( t.fear_count, 0) as  fear_count

      ,isnull( t.confusion_count, 0) as  confusion_count
      ,isnull( t.hurt_count, 0) as  hurt_count
      ,isnull( t.anger_count, 0) as  anger_count
      ,isnull( t.loneliness_count, 0) as  loneliness_count
	  ,isnull( t.remorse_count, 0) as  remorse_count
  FROM [birddog].[dbo].[full_quotes] q LEFT JOIN (
	select 
		 [key] as symbol
		,[year] as [year]
		,[month] as [month]
		,[day] as [day]
		, [hour] as [hour]
		,[minute] as [minute]

		, count(*) as total_tweets
		, sum([bing_positive]) as bing_positive_count
		, sum([bing_negative]) as bing_negative_count
		, sum([D_Happiness]) as happiness_count
		, sum([D_Caring]) as caring_count
		, sum([D_Depression]) as depression_count
		, sum([D_Inadequateness]) as inadequateness_count
		, sum([D_Fear]) as fear_count
		, sum([D_Confusion]) as confusion_count
		, sum([D_Hurt]) as hurt_count
		, sum([D_Anger]) as anger_count
		, sum([D_Loneliness]) as loneliness_count
		, sum([D_Remorse]) as remorse_count
	from [birddog].[dbo].[key_bridge] k
	where [key] = 'MSFT'
	group by  
			  [key]
			, [year]
			, [month]
			, [day]
			, [hour]
			, [minute]
) t on 

	q.[month] = t.[month]
	 and q.[year] = t.[year]
	 and q.[day] = t.[day]
	 and q.[hour] = t.[hour]
	 and q.[minute] = t.[minute]
	 and q.symbol = t.symbol
	 where q.symbol = 'MSFT'
	 Order by q.[month], q.[year], q.[day], q.[hour], q.[minute]

  
