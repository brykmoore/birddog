USE [birddog]
GO

/****** Object:  Table [dbo].[full_quotes]    Script Date: 2/18/2015 10:06:27 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

SET ANSI_PADDING ON
GO

CREATE TABLE [dbo].[full_quotes](
	[id] [bigint] IDENTITY(1,1) NOT NULL,
	[year] [int] NULL,
	[month] [int] NULL,
	[day] [int] NULL,
	[hour] [int] NULL,
	[minute] [int] NULL,
	[symbol] [varchar](50) NULL,
	[trade_price] [decimal](18, 5) NULL,
	[change] [varchar](50) NULL,
	[change_in_percent] [varchar](50) NULL,
	[average_daily_volume] [int] NULL,
 CONSTRAINT [PK_full_quotes] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

SET ANSI_PADDING OFF
GO

