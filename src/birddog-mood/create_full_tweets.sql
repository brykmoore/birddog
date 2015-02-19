USE [birddog]
GO

/****** Object:  Table [dbo].[full_tweets]    Script Date: 2/18/2015 10:06:17 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

SET ANSI_PADDING ON
GO

CREATE TABLE [dbo].[full_tweets](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[id_str] [varchar](50) NULL,
	[year] [int] NULL,
	[month] [int] NULL,
	[day] [int] NULL,
	[hour] [int] NULL,
	[minute] [int] NULL,
	[text] [varchar](300) NULL,
	[key1] [varchar](10) NULL,
	[key2] [varchar](10) NULL,
	[key3] [varchar](10) NULL,
	[key4] [varchar](10) NULL,
	[key5] [varchar](10) NULL,
	[key6] [varchar](10) NULL,
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
	[D_Remorse] [decimal](18, 5) NULL,
 CONSTRAINT [PK_full_tweets] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_PADDING OFF
GO

