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

namespace Demo
{
    class DataAccess
    {
        private string connectionString {get; set;}

        public DataAccess(string connectionString)
        {
            this.connectionString = connectionString;
        }

        public void ExecuteNonQuery(string command)
        {
            using (var sqlConnection = new SqlConnection(connectionString))
            {
                sqlConnection.Open();

                using (var sqlCommand = new SqlCommand(command, sqlConnection))
                {
                    sqlCommand.CommandTimeout = 3000;
                    sqlCommand.ExecuteNonQuery();
                }

                sqlConnection.Close();
            }
        }

        public int GetCount()
        {
            var count = 0;

            using (var sqlConnection = new SqlConnection(connectionString))
            {
                sqlConnection.Open();

                // Truncate the live table
                using (var sqlCommand = new SqlCommand("SELECT Count(*) from full_tweets", sqlConnection))
                {
                    sqlCommand.CommandTimeout = 300;
                    count = (int)sqlCommand.ExecuteScalar();
                }


                sqlConnection.Close();
            }
            return count;
        }

        public List<fulltweets> ExecuteTweetBatchRead(int i, int batchSize)
        {
            var tweetList = new List<fulltweets>();
            using (var sqlConnection = new SqlConnection(connectionString))
            {
                sqlConnection.Open();

                using (var sqlCommand = new SqlCommand("SELECT id, text from full_tweets where id >= " +
                    (i * batchSize).ToString() + " AND id < " + ((i + 1) * batchSize).ToString(), sqlConnection))
                {
                    sqlCommand.CommandTimeout = 3600;
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
            return tweetList;
        }

        private DataTable Setup_TweetMood_DataTable()
        {

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

            return dataTable;
        }

        private void InsertDataTable(SqlBulkCopy sqlBulkCopy, SqlConnection sqlConnection, DataTable dataTable)
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

        public void BatchWrite(ConcurrentBag<fulltweets> concurrentTweets)
        {
            var dataTable = Setup_TweetMood_DataTable();
            using (var sqlConnection = new SqlConnection("data source=BUFFALO-SOLDIER;initial catalog=birddog;integrated security=True;"))
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
}
