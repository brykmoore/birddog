using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CSVExport
{
    class Program
    {
        static void Main(string[] args)
        {
            var listOfSymbols = new List<string>();
            listOfSymbols.Add("MMM");
            listOfSymbols.Add("AXP");
            listOfSymbols.Add("T");
            listOfSymbols.Add("BA");
            listOfSymbols.Add("CAT");
            listOfSymbols.Add("CVX");
            listOfSymbols.Add("CSCO");
            listOfSymbols.Add("KO");
            listOfSymbols.Add("DIS");
            listOfSymbols.Add("DD");
            listOfSymbols.Add("XOM");
            listOfSymbols.Add("GE");
            listOfSymbols.Add("GS");
            listOfSymbols.Add("HD");
            listOfSymbols.Add("IBM");
            listOfSymbols.Add("INTC");
            listOfSymbols.Add("JNJ");
            listOfSymbols.Add("JPM");
            listOfSymbols.Add("MCD");
            listOfSymbols.Add("MRK");
            listOfSymbols.Add("MSFT");
            listOfSymbols.Add("NKE");
            listOfSymbols.Add("PFE");
            listOfSymbols.Add("PG");
            listOfSymbols.Add("TRV");
            listOfSymbols.Add("UTX");
            listOfSymbols.Add("UNH");
            listOfSymbols.Add("VZ");
            listOfSymbols.Add("V");
            listOfSymbols.Add("WMT");
            foreach(var symbol in listOfSymbols){
                var fullTweetQuery = @"
            SELECT
            k.[year],
            k.[month],
            k.[day],
            k.[hour],
            k.[minute],
            k.[key],
            f.[text],
            k.[bing_positive],
            k.[bing_negative],
            k.[D_Happiness],
            k.[D_Caring],
            k.[D_Depression],
            k.[D_Inadequateness],
            k.[D_Fear],
            k.[D_Confusion],
            k.[D_Hurt],
            k.[D_Anger],
            k.[D_Loneliness],
            k.[D_Remorse]

  FROM [birddog].[dbo].[key_bridge] k join [birddog].[dbo].[full_tweets] f on k.id = f.id where k.[key] = '{0}' order by k.[year],
      k.[month], k.[day], k.[hour], k.[minute]".Replace("{0}", symbol);
                var query = @"SELECT
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
	            where [key] = '{0}'
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
	             where q.symbol = '{0}'
	             Order by q.[month], q.[year], q.[day], q.[hour], q.[minute]".Replace("{0}", symbol);


                var destinationFile = symbol + ".csv";
                var fullFile = symbol + "-tweets.csv";
                QueryAndWriteToCSV(destinationFile, query);
                QueryAndWriteToCSV(fullFile, fullTweetQuery);

            }//end foreach
        }

        private static void QueryAndWriteToCSV(string destinationFile, string query){
                            using (var sqlConnection = new SqlConnection("data source=BUFFALO-SOLDIER;initial catalog=birddog;integrated security=True;"))
                {
                    sqlConnection.Open();

                    using (var sqlCommand = new SqlCommand(query, sqlConnection))
                    {
                        sqlCommand.CommandTimeout = 360;
                        using (var reader = sqlCommand.ExecuteReader())
                        using (var outFile = File.CreateText(destinationFile))
                        {
                            string[] columnNames = GetColumnNames(reader).ToArray();
                            int numFields = columnNames.Length;
                            outFile.WriteLine(string.Join(",", columnNames));
                            if (reader.HasRows)
                            {
                                while (reader.Read())
                                {
                                    string[] columnValues =
                                        Enumerable.Range(0, numFields)
                                                  .Select(i => reader.GetValue(i).ToString())
                                                  .Select(field => string.Concat("\"", field.Replace("\"", "\"\""), "\""))
                                                  .ToArray();
                                    outFile.WriteLine(string.Join(",", columnValues));
                                }
                            }
                        }
                    }


                    sqlConnection.Close();
                }
        }
        private static IEnumerable<string> GetColumnNames(IDataReader reader)
        {
            foreach (DataRow row in reader.GetSchemaTable().Rows)
            {
                yield return (string)row["ColumnName"];
            }
        }
    }
}
