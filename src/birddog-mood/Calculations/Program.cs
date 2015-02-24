using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Calculations
{
    public class fulltweets
    {
        public Int64 id { get; set; }
        public string key1 { get; set; }
        public string key2 { get; set; }
        public string key3 { get; set; }
        public string key4 { get; set; }
        public string key5 { get; set; }
        public string key6 { get; set; }
        public decimal bing_positive { get; set; }
        public decimal bing_negative { get; set; }
        public decimal D_Happiness { get; set; }
        public decimal D_Caring { get; set; }
        public decimal D_Depression { get; set; }
        public decimal D_Inadequateness { get; set; }
        public decimal D_Fear { get; set; }
        public decimal D_Confusion { get; set; }
        public decimal D_Hurt { get; set; }
        public decimal D_Anger { get; set; }
        public decimal D_Loneliness { get; set; }
        public decimal D_Remorse { get; set; }
        public int year { get; set; }
        public int month { get; set; }
        public int day { get; set; }
        public int hour { get; set; }
        public int minute { get; set; }
    }

    public class keybridge {
        public Int64 id { get; set; }
        public string key { get; set; }
        public int year { get; set; }
        public int month { get; set; }   
        public int day { get; set; }
        public int hour { get; set; }
        public int minute { get; set; }
        public decimal bing_positive { get; set; }
        public decimal bing_negative { get; set; }
        public decimal D_Happiness { get; set; }
        public decimal D_Caring { get; set; }
        public decimal D_Depression { get; set; }
        public decimal D_Inadequateness { get; set; }
        public decimal D_Fear { get; set; }
        public decimal D_Confusion { get; set; }
        public decimal D_Hurt { get; set; }
        public decimal D_Anger { get; set; }
        public decimal D_Loneliness { get; set; }
        public decimal D_Remorse { get; set; }
    }

    class Program
    {

        static void Main(string[] args)
        {

            var startTime = DateTime.Now;


            var count = getCount();
            var batchSize = 500000;
            var rounds = (count / batchSize) + 1;
            var list = new List<string>();
            var dataTable = new DataTable("tweet_moods");

            dataTable.Columns.Add("id");

            dataTable.Columns.Add("key");

            dataTable.Columns.Add("bing_positive");
            dataTable.Columns.Add("bing_negative");

            dataTable.Columns.Add("D_Happiness");
            dataTable.Columns.Add("D_Caring");
            dataTable.Columns.Add("D_Depression");
            dataTable.Columns.Add("D_Inadequateness");
            dataTable.Columns.Add("D_Fear");

            dataTable.Columns.Add("D_Confusion");
            dataTable.Columns.Add("D_Hurt");
            dataTable.Columns.Add("D_Anger");
            dataTable.Columns.Add("D_Loneliness");
            dataTable.Columns.Add("D_Remorse");

            dataTable.Columns.Add("year");
            dataTable.Columns.Add("month");
            dataTable.Columns.Add("day");
            dataTable.Columns.Add("hour");
            dataTable.Columns.Add("minute");

            for (int i = 0; i < rounds; i++)
            {
                var tweetList = new List<fulltweets>();
                using (var sqlConnection = new SqlConnection("data source=BUFFALO-PC;initial catalog=birddog;integrated security=True;"))
                {
                    sqlConnection.Open();

                    using (var sqlCommand = new SqlCommand("SELECT id, key1, key2, key3, key4, key5, key6, bing_positive,bing_negative,D_Happiness,D_Caring,D_Depression,D_Inadequateness,D_Fear,D_Confusion,D_Hurt,D_Anger,D_Loneliness,D_Remorse,year,month,day,hour,minute from full_tweets where id >= " +
                        (i * batchSize).ToString() + " AND id < " + ((i + 1) * batchSize).ToString(), sqlConnection))
                    {
                        using (var reader = sqlCommand.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                tweetList.Add(new fulltweets
                                {
                                    id = reader.GetInt64(0),
                                    key1 = reader.GetString(1),
                                    key2 = reader.GetString(2),
                                    key3 = reader.GetString(3),
                                    key4 = reader.GetString(4),
                                    key5 = reader.GetString(5),
                                    key6 = reader.GetString(6),
                                    
                                    bing_positive = reader.GetDecimal(7),
                                    bing_negative = reader.GetDecimal(8),
                                    D_Happiness = reader.GetDecimal(9),
                                    D_Caring = reader.GetDecimal(10),
                                    D_Depression = reader.GetDecimal(11),
                                    D_Inadequateness = reader.GetDecimal(12),
                                    D_Fear = reader.GetDecimal(13),

                                    D_Confusion = reader.GetDecimal(14),
                                    D_Hurt = reader.GetDecimal(15),
                                    D_Anger = reader.GetDecimal(16),
                                    D_Loneliness = reader.GetDecimal(17),
                                    D_Remorse = reader.GetDecimal(18),

                                    year = reader.GetInt32(19),
                                    month = reader.GetInt32(20),
                                    day = reader.GetInt32(21),
                                    hour = reader.GetInt32(22),
                                    minute = reader.GetInt32(23)


                                });
                            }
                        }
                    }


                    sqlConnection.Close();
                }
                var concurrentTweets = new ConcurrentBag<keybridge>();
                Parallel.ForEach(tweetList, item =>
                {
                    var returnList = process(item);

                    foreach(var returnItem in returnList)
                    {
                        concurrentTweets.Add(returnItem);
                    }
                });

                Console.WriteLine(DateTime.Now - startTime);

                using (var sqlConnection = new SqlConnection("data source=BUFFALO-PC;initial catalog=birddog;integrated security=True;"))
                {
                    sqlConnection.Open();

                    // Create the bulk copy object
                    var sqlBulkCopy = new SqlBulkCopy(sqlConnection)
                    {
                        DestinationTableName = "key_bridge"
                    };

                    // Setup the column mappings, anything ommitted is skipped
                    sqlBulkCopy.ColumnMappings.Add("id", "id");
                    sqlBulkCopy.ColumnMappings.Add("key", "key");
                    sqlBulkCopy.ColumnMappings.Add("bing_positive", "bing_positive");
                    sqlBulkCopy.ColumnMappings.Add("bing_negative", "bing_negative");

                    sqlBulkCopy.ColumnMappings.Add("D_Happiness", "D_Happiness");
                    sqlBulkCopy.ColumnMappings.Add("D_Caring", "D_Caring");
                    sqlBulkCopy.ColumnMappings.Add("D_Depression", "D_Depression");
                    sqlBulkCopy.ColumnMappings.Add("D_Inadequateness", "D_Inadequateness");
                    sqlBulkCopy.ColumnMappings.Add("D_Fear", "D_Fear");

                    sqlBulkCopy.ColumnMappings.Add("D_Confusion", "D_Confusion");
                    sqlBulkCopy.ColumnMappings.Add("D_Hurt", "D_Hurt");
                    sqlBulkCopy.ColumnMappings.Add("D_Anger", "D_Anger");
                    sqlBulkCopy.ColumnMappings.Add("D_Loneliness", "D_Loneliness");
                    sqlBulkCopy.ColumnMappings.Add("D_Remorse", "D_Remorse");

                    sqlBulkCopy.ColumnMappings.Add("year", "year");
                    sqlBulkCopy.ColumnMappings.Add("month", "month");
                    sqlBulkCopy.ColumnMappings.Add("day", "day");
                    sqlBulkCopy.ColumnMappings.Add("hour", "hour");
                    sqlBulkCopy.ColumnMappings.Add("minute", "minute");

                    var _batchSize = 100000;
                    var listOfTweets = concurrentTweets.ToList();
                    for (int j = 0; j < listOfTweets.Count; j++)
                    {
                        dataTable.Rows.Add(
                            listOfTweets[j].id, 
                            listOfTweets[j].key,

                            listOfTweets[j].bing_positive,
                            listOfTweets[j].bing_negative,

                            listOfTweets[j].D_Happiness,
                            listOfTweets[j].D_Caring,
                            listOfTweets[j].D_Depression,
                            listOfTweets[j].D_Inadequateness,
                            listOfTweets[j].D_Fear,

                            listOfTweets[j].D_Confusion,
                            listOfTweets[j].D_Hurt,
                            listOfTweets[j].D_Anger,
                            listOfTweets[j].D_Loneliness,
                            listOfTweets[j].D_Remorse,

                            listOfTweets[j].year,
                            listOfTweets[j].month,
                            listOfTweets[j].day,
                            listOfTweets[j].hour,
                            listOfTweets[j].minute

                            
                            
                            );

                        if (j % _batchSize == 0)
                        {
                            InsertDataTable(sqlBulkCopy, sqlConnection, dataTable);
                        }
                    }

                    // Don't forget to send the last batch under 100,000
                    InsertDataTable(sqlBulkCopy, sqlConnection, dataTable);

                    sqlConnection.Close();
                }
            }
        }

        static List<keybridge> process(fulltweets tweet) {

            var keybridge = new List<keybridge>();

            var keybridgeItem = new keybridge
            {
                id = tweet.id,
                year = tweet.year,
                day = tweet.day,
                month = tweet.month,
                hour = tweet.hour,
                minute = tweet.minute,

                bing_negative = tweet.bing_negative,
                bing_positive = tweet.bing_positive,

                D_Anger = tweet.D_Anger,
                D_Caring = tweet.D_Caring,
                D_Confusion = tweet.D_Confusion,
                D_Depression = tweet.D_Depression,
                D_Fear = tweet.D_Fear,

                D_Happiness = tweet.D_Happiness,
                D_Hurt = tweet.D_Hurt,
                D_Inadequateness = tweet.D_Inadequateness,
                D_Loneliness = tweet.D_Loneliness,
                D_Remorse = tweet.D_Remorse
            };
            if(tweet.key1 != ""){
                keybridgeItem.key = tweet.key1;
                keybridge.Add(keybridgeItem);
            }
            if (tweet.key2 != "")
            {
                keybridgeItem.key = tweet.key2;
                keybridge.Add(keybridgeItem);
            }
            if (tweet.key3 != "")
            {
                keybridgeItem.key = tweet.key3;
                keybridge.Add(keybridgeItem);
            }
            if (tweet.key4 != "")
            {
                keybridgeItem.key = tweet.key4;
                keybridge.Add(keybridgeItem);
            }
            if (tweet.key5 != "")
            {
                keybridgeItem.key = tweet.key5;
                keybridge.Add(keybridgeItem);
            }
            if (tweet.key6 != "")
            {
                keybridgeItem.key = tweet.key6;
                keybridge.Add(keybridgeItem);
            }
            return keybridge;
        
        }
        static int getCount()
        {
            var count = 0;

            using (var sqlConnection = new SqlConnection("data source=BUFFALO-PC;initial catalog=birddog;integrated security=True;"))
            {
                sqlConnection.Open();

                // Truncate the live table
                using (var sqlCommand = new SqlCommand("SELECT Count(*) from full_tweets", sqlConnection))
                {
                    sqlCommand.CommandTimeout = 120;
                    count = (int)sqlCommand.ExecuteScalar();
                }


                sqlConnection.Close();
            }
            return count;
        }

        private static void InsertDataTable(SqlBulkCopy sqlBulkCopy, SqlConnection sqlConnection, DataTable dataTable)
        {
            try
            {
                sqlBulkCopy.WriteToServer(dataTable);

                dataTable.Rows.Clear();
            }
            catch (SqlException ex)
            {
                if (ex.Message.Contains("Received an invalid column length from the bcp client for colid"))
                {
                    string pattern = @"\d+";
                    Match match = Regex.Match(ex.Message.ToString(), pattern);
                    var index = Convert.ToInt32(match.Value) - 1;

                    FieldInfo fi = typeof(SqlBulkCopy).GetField("_sortedColumnMappings", BindingFlags.NonPublic | BindingFlags.Instance);
                    var sortedColumns = fi.GetValue(sqlBulkCopy);
                    var items = (Object[])sortedColumns.GetType().GetField("_items", BindingFlags.NonPublic | BindingFlags.Instance).GetValue(sortedColumns);

                    FieldInfo itemdata = items[index].GetType().GetField("_metadata", BindingFlags.NonPublic | BindingFlags.Instance);
                    var metadata = itemdata.GetValue(items[index]);

                    var column = metadata.GetType().GetField("column", BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance).GetValue(metadata);
                    var length = metadata.GetType().GetField("length", BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance).GetValue(metadata);
                    throw new Exception(String.Format("Column: {0} contains data with a length greater than: {1}", column, length));
                }

                throw;
            }
        }
    }
}
