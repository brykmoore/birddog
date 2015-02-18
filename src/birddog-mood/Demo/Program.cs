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

namespace Demo
{
    public class fulltweets {
        public int id { get; set; }
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
                
            var stemmer = new Stemming();
            var moodList = new MoodListing().BingLiuMoodList;
            trie = new Trie<MoodValue>();
            foreach (var item in moodList)
            {
                //trie.Add(stemmer.Stem(item.Word), item.Value);
                trie.Add(item.Word, item.Value);
            }

            trie.Build();

            var drummondmoodList = new MoodListing().DrummondMoodList;
            drummondTrie = new Trie<MoodValue>();
            foreach (var item in moodList)
            {
                trie.Add(stemmer.Stem(item.Word), item.Value);
            }

            trie.Build();
            //6,915,322

            var count = getCount();
            var batchSize = 200000;
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


            for (int i = 0; i < rounds; i++ )
            {
                var tweetList = new List<fulltweets>();
                using (var sqlConnection = new SqlConnection("data source=BUFFALO-PC;initial catalog=birddog;integrated security=True;"))
                {
                    sqlConnection.Open();

                    // Truncate the live table
                    using (var sqlCommand = new SqlCommand("SELECT id, text from full_tweets where id >= " +
                        (i * batchSize).ToString() + " AND id < " + ((i + 1) * batchSize).ToString(), sqlConnection))
                    {
                        using (var reader = sqlCommand.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                var typeid = reader["text"].GetType();
                                var typetext = reader["id"].GetType();
                                var something = 9;
                                tweetList.Add(new fulltweets {
                                    id = (int)reader.GetInt64(0),
                                    text = (string)reader.GetString(1)
                                });
                            }
                        }
                    }


                    sqlConnection.Close();
                }

                for(int j = 0; j < tweetList.Count; j++){
                    tweetList[j] = process(tweetList[j]);
                }
                for (int j = 0; j < tweetList.Count; j++)
                {
                    tweetList[j] = process(tweetList[j]);
                }

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
                    for (int j = 0; j < tweetList.Count; j++)
                    {
                        dataTable.Rows.Add(tweetList[j].id, 
                            
                            tweetList[j].bing_positive,
                            tweetList[j].bing_negative,

                            tweetList[j].D_Happiness,
                            tweetList[j].D_Caring,
                            tweetList[j].D_Depression,
                            tweetList[j].D_Inadequateness,
                            tweetList[j].D_Fear,

                            tweetList[j].D_Confusion,
                            tweetList[j].D_Hurt,
                            tweetList[j].D_Anger,
                            tweetList[j].D_Loneliness,
                            tweetList[j].D_Remorse                            
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

            var returnValue = processBingLiu(item.text);
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

            var returnValueTwo = processDrummond(item.text);

            //HAPPINESS
            var happiness = returnValue.Where(x => x.Category == "Happiness").ToList();
            if (happiness != null && happiness.Count > 0)
            {
                item.D_Happiness = (int)happiness.First().Count;
            }
            else
            {
                item.D_Happiness = 0;
            }

            //CARING
            var caring = returnValue.Where(x => x.Category == "Caring").ToList();
            if (caring != null && caring.Count > 0)
            {
                item.D_Caring = (int)caring.First().Count;
            }
            else
            {
                item.D_Caring = 0;
            }

            //DEPRESSION
            var depression = returnValue.Where(x => x.Category == "Depression").ToList();
            if (depression != null && depression.Count > 0)
            {
                item.D_Depression = (int)depression.First().Count;
            }
            else
            {
                item.D_Depression = 0;
            }

            //INADEQUATENESS
            var inadequateness = returnValue.Where(x => x.Category == "Inadequateness").ToList();
            if (inadequateness != null && inadequateness.Count > 0)
            {
                item.D_Inadequateness = (int)inadequateness.First().Count;
            }
            else
            {
                item.D_Inadequateness = 0;
            }

            //FEAR
            var fear = returnValue.Where(x => x.Category == "Fear").ToList();

            if (fear != null && fear.Count > 0)
            {
                item.D_Fear = (int)fear.First().Count;
            }
            else
            {
                item.D_Fear = 0;
            }

            //CONFUSION
            var confusion = returnValue.Where(x => x.Category == "Confusion").ToList();
            if (confusion != null && confusion.Count > 0)
            {
                item.D_Confusion = (int)confusion.First().Count;
            }
            else
            {
                item.D_Confusion = 0;
            }

            //HURT
            var hurt = returnValue.Where(x => x.Category == "Hurt").ToList();

            if (hurt != null && hurt.Count > 0)
            {
                item.D_Hurt = (int)hurt.First().Count;
            }
            else
            {
                item.D_Hurt = 0;
            }

            //ANGER
            var anger = returnValue.Where(x => x.Category == "Anger").ToList();
            if (anger != null && anger.Count > 0)
            {
                item.D_Anger = (int)anger.First().Count;
            }
            else
            {
                item.D_Anger = 0;
            }

            //LONELINESS
            var loneliness = returnValue.Where(x => x.Category == "Loneliness").ToList();
            if (loneliness != null && loneliness.Count > 0)
            {
                item.D_Loneliness = (int)loneliness.First().Count;
            }
            else
            {
                item.D_Loneliness = 0;
            }

            //REMORSE
            var remorse = returnValue.Where(x => x.Category == "Remorse").ToList();
            if (remorse != null && remorse.Count > 0)
            {
                item.D_Remorse = (int)remorse.First().Count;
            }
            else
            {
                item.D_Remorse = 0;
            }


            return item;

        }

        private static Trie<MoodValue> trie;
        private static Trie<MoodValue> drummondTrie;
        private static List<MoodItem> drummondMoodList;

        private static List<MoodItem> moodList;
        private static List<MoodFrequencyItem> processDrummond(string text)
        {
            var stemmer = new Stemming();

            //lowercase
            text = text.ToLower();
            //strip punctuation
            text = new string(text.Where(x => !char.IsPunctuation(x)).ToArray());
            //var stemmer = new EnglishStemmer();


            var matches = Regex.Matches(text, @"((\b[^\s]+\b)((?<=\.\w).)?)");
            var inputString = "";

            foreach (var item in matches)
            {
                inputString += stemmer.Stem(item.ToString()) + " ";
            }
            var list = drummondTrie.Find(inputString).GroupBy(x => new { x.Category }).Select(g => new MoodFrequencyItem()
            {
                Category = g.Key.Category,
                Count = g.Sum(x => x.Weight)
            }).ToList();

            var moodResults = drummondMoodList.Select(x => x.Value.Category).Distinct().Select(y => new MoodFrequencyItem
            {
                Category = y
            }).ToList();
            var sum = list.Sum(mood => mood.Count);

            foreach (var mood in list)
            {
                var firstOrDefault = moodResults.FirstOrDefault(x => x.Category == mood.Category);
                if (firstOrDefault != null)
                {
                    firstOrDefault.Count = mood.Count / sum;
                }
            }
            return list;
        }
        private static List<MoodFrequencyItem> processBingLiu(string text){
            var stemmer = new Stemming();

            //lowercase
            text = text.ToLower();
            //strip punctuation
            text = new string(text.Where(x => !char.IsPunctuation(x)).ToArray());
            //var stemmer = new EnglishStemmer();


            var matches = Regex.Matches(text, @"((\b[^\s]+\b)((?<=\.\w).)?)");
            var inputString = "";

            foreach (var item in matches)
            {
                inputString += item.ToString() + " ";
            }
            var list = trie.Find(inputString).GroupBy(x => new { x.Category }).Select(g => new MoodFrequencyItem()
            {
                Category = g.Key.Category,
                Count = g.Sum(x => x.Weight)
            }).ToList();

            var moodResults = moodList.Select(x => x.Value.Category).Distinct().Select(y => new MoodFrequencyItem
            {
                Category = y
            }).ToList();
            var sum = list.Sum(mood => mood.Count);

            foreach (var mood in list)
            {
                var firstOrDefault = moodResults.FirstOrDefault(x => x.Category == mood.Category);
                if (firstOrDefault != null)
                {
                    firstOrDefault.Count = mood.Count / sum;
                }
            }
            return list;
        }
    }
}
