USE [birddog]
GO

/****** Object:  Table [dbo].[tweet_moods]    Script Date: 2/18/2015 10:06:04 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[tweet_moods](
	[id] [bigint] NULL,
	[bing_positive] [decimal](18, 5) NULL,
	[bing_negative] [decimal](18, 5) NULL,
	[D_Happiness] [decimal](18, 5) NULL,
	[D_Caring] [decimal](18, 5) NULL,
	[D_Depression] [decimal](18, 5) NULL,
	[D_Inadequateness] [decimal](18, 5) NULL,
	[D_Fear] [decimal](18, 5) NULL,
	[D_Confusion] [decimal](18, 5) NULL,
	[D_Hurt] [decimal](18, 5) NULL,
	[D_Anger] [decimal](18, 5) NULL,
	[D_Loneliness] [decimal](18, 5) NULL,
	[D_Remorse] [decimal](18, 5) NULL
) ON [PRIMARY]

GO

