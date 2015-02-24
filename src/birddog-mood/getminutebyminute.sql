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
	  ,t.bing_positive_count
      ,t.bing_negative_count
      ,t.happiness_count
      ,t.caring_count
      ,t.depression_count
      ,t.inadequateness_count
      ,t.fear_count

      ,t.confusion_count
      ,t.hurt_count
      ,t.anger_count
      ,t.loneliness_count
	  ,t.remorse_count
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
	 where q.symbol = 'MMM'


  
