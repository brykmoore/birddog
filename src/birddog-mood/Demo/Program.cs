using System;

using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Iveonik.Stemmers;
using MoodFinder;
using MoodFinder.Domain;
using MoodFinder.StringMatching;
using System.Collections.Generic;
using System.Data;
using System.Reflection;
using System.Collections.Concurrent;

namespace Demo
{
    public class fulltweets {
        public Int64 id { get; set; }
        public string text { get; set; }
        public decimal bing_positive { get; set; }
        public decimal bing_negative {get; set;}
        public decimal D_Happiness{get; set;}
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
            stemmer = new Stemming();
            moodList = new MoodListing().BingLiuMoodList;
            bingliuTrie = new Trie<MoodValue>();
            foreach (var item in moodList)
            {
                bingliuTrie.Add(item.Word, item.Value);
            }

            bingliuTrie.Build();

            drummondMoodList = new MoodListing().DrummondMoodList;
            drummondTrie = new Trie<MoodValue>();
            foreach (var item in drummondMoodList)
            {
                drummondTrie.Add(item.Word, item.Value);
            }

            drummondTrie.Build();

            var count = getCount();
            var batchSize = 500000;
            var rounds = (count / batchSize) + 1;
            var list = new List<string>();
            var dataTable = new DataTable("tweet_moods");

            dataTable.Columns.Add("id");

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
            var _truncateLiveTableCommandText = @"TRUNCATE TABLE tweet_moods";
            using (var sqlConnection = new SqlConnection("data source=BUFFALO-PC;initial catalog=birddog;integrated security=True;"))
            {
                sqlConnection.Open();

                // Truncate the live table
                using (var sqlCommand = new SqlCommand(_truncateLiveTableCommandText, sqlConnection))
                {
                    sqlCommand.ExecuteNonQuery();
                }

                sqlConnection.Close();
            }
            for (int i = 0; i < rounds; i++)
            {
                var tweetList = new List<fulltweets>();
                using (var sqlConnection = new SqlConnection("data source=BUFFALO-PC;initial catalog=birddog;integrated security=True;"))
                {
                    sqlConnection.Open();

                    using (var sqlCommand = new SqlCommand("SELECT id, text from full_tweets where id >= " +
                        (i * batchSize).ToString() + " AND id < " + ((i + 1) * batchSize).ToString(), sqlConnection))
                    {
                        using (var reader = sqlCommand.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                tweetList.Add(new fulltweets
                                {
                                    id = reader.GetInt64(0),
                                    text = reader.GetString(1)
                                });
                            }
                        }
                    }


                    sqlConnection.Close();
                }
                var concurrentTweets = new ConcurrentBag<fulltweets>();
                Parallel.ForEach(tweetList, item =>
                {
                    concurrentTweets.Add(process(item));
                });

                Console.WriteLine(DateTime.Now - startTime);

                using (var sqlConnection = new SqlConnection("data source=BUFFALO-PC;initial catalog=birddog;integrated security=True;"))
                {
                    sqlConnection.Open();

                    // Create the bulk copy object
                    var sqlBulkCopy = new SqlBulkCopy(sqlConnection)
                    {
                        DestinationTableName = "tweet_moods"
                    };

                    // Setup the column mappings, anything ommitted is skipped
                    sqlBulkCopy.ColumnMappings.Add("id", "id");
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
                    var _batchSize = 100000;
                    var listOfTweets = concurrentTweets.ToList();
                    for (int j = 0; j < listOfTweets.Count; j++)
                    {
                        dataTable.Rows.Add(listOfTweets[j].id,

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
                            listOfTweets[j].D_Remorse
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

        public static fulltweets process(fulltweets item)
        {
            //lowercase
            item.text = item.text.ToLower();
            //strip punctuation
            item.text = new string(item.text.Where(x => !char.IsPunctuation(x)).ToArray());
            //var stemmer = new EnglishStemmer();


            var matches = Regex.Matches(item.text, @"((\b[^\s]+\b)((?<=\.\w).)?)");
            var inputString = "";

            foreach (var unit in matches)
            {
                inputString += unit.ToString() + " ";
            }


            var returnValue = processBingLiu(inputString);
            var positive = returnValue.Where(x => x.Category == "Positive").ToList();
            var negative = returnValue.Where(x => x.Category == "Negative").ToList();
            if (positive != null && positive.Count > 0)
            {
                item.bing_positive = (int)positive.First().Count;
            }
            else {
                item.bing_positive = 0;
            }
            if (negative != null && negative.Count > 0)
            {
                item.bing_negative = (int)negative.First().Count;
            }
            else
            {
                item.bing_negative = 0;
            }

            returnValue = processDrummond(inputString);

            //HAPPINESS
            var happiness = returnValue.Where(x => x.Category == "Happiness").ToList();
            if (happiness != null && happiness.Count > 0)
            {
                item.D_Happiness = (decimal)happiness.First().Count;
            }
            else
            {
                item.D_Happiness = 0;
            }

            //CARING
            var caring = returnValue.Where(x => x.Category == "Caring").ToList();
            if (caring != null && caring.Count > 0)
            {
                item.D_Caring = (decimal)caring.First().Count;
            }
            else
            {
                item.D_Caring = 0;
            }

            //DEPRESSION
            var depression = returnValue.Where(x => x.Category == "Depression").ToList();
            if (depression != null && depression.Count > 0)
            {
                item.D_Depression = (decimal)depression.First().Count;
            }
            else
            {
                item.D_Depression = 0;
            }

            //INADEQUATENESS
            var inadequateness = returnValue.Where(x => x.Category == "Inadequateness").ToList();
            if (inadequateness != null && inadequateness.Count > 0)
            {
                item.D_Inadequateness = (decimal)inadequateness.First().Count;
            }
            else
            {
                item.D_Inadequateness = 0;
            }

            //FEAR
            var fear = returnValue.Where(x => x.Category == "Fear").ToList();

            if (fear != null && fear.Count > 0)
            {
                item.D_Fear = (decimal)fear.First().Count;
            }
            else
            {
                item.D_Fear = 0;
            }

            //CONFUSION
            var confusion = returnValue.Where(x => x.Category == "Confusion").ToList();
            if (confusion != null && confusion.Count > 0)
            {
                item.D_Confusion = (decimal)confusion.First().Count;
            }
            else
            {
                item.D_Confusion = 0;
            }

            //HURT
            var hurt = returnValue.Where(x => x.Category == "Hurt").ToList();

            if (hurt != null && hurt.Count > 0)
            {
                item.D_Hurt = (decimal)hurt.First().Count;
            }
            else
            {
                item.D_Hurt = 0;
            }

            //ANGER
            var anger = returnValue.Where(x => x.Category == "Anger").ToList();
            if (anger != null && anger.Count > 0)
            {
                item.D_Anger = (decimal)anger.First().Count;
            }
            else
            {
                item.D_Anger = 0;
            }

            //LONELINESS
            var loneliness = returnValue.Where(x => x.Category == "Loneliness").ToList();
            if (loneliness != null && loneliness.Count > 0)
            {
                item.D_Loneliness = (decimal)loneliness.First().Count;
            }
            else
            {
                item.D_Loneliness = 0;
            }

            //REMORSE
            var remorse = returnValue.Where(x => x.Category == "Remorse").ToList();
            if (remorse != null && remorse.Count > 0)
            {
                item.D_Remorse = (decimal)remorse.First().Count;
            }
            else
            {
                item.D_Remorse = 0;
            }


            return item;

        }

        private static Trie<MoodValue> bingliuTrie;
        private static Trie<MoodValue> drummondTrie;
        private static List<MoodItem> drummondMoodList;
        private static Stemming stemmer;
        private static List<MoodItem> moodList;
        private static List<MoodFrequencyItem> processDrummond(string inputString)
        {
            var result = drummondTrie.Find(inputString).GroupBy(x=> new { x.Category});
            var list = drummondTrie.Find(inputString).GroupBy(x => new { x.Category }).Select(g => new MoodFrequencyItem()
            {
                Category = g.Key.Category,
                Count = g.Sum(x => x.Weight)
            }).ToList();

            var moodResults = drummondMoodList.Select(x => x.Value.Category).Distinct().Select(y => new MoodFrequencyItem
            {
                Category = y
            }).ToList();

            foreach (var mood in list)
            {
                var firstOrDefault = moodResults.FirstOrDefault(x => x.Category == mood.Category);
                if (firstOrDefault != null)
                {
                    firstOrDefault.Count = mood.Count;
                }
            }

            return moodResults;
        }

        private static List<MoodFrequencyItem> processBingLiu(string inputString)
        {
            var list = bingliuTrie.Find(inputString).GroupBy(x => new { x.Category }).Select(g => new MoodFrequencyItem()
            {
                Category = g.Key.Category,
                Count = g.Sum(x => x.Weight)
            }).ToList();


            return list;
        }
    }
}
