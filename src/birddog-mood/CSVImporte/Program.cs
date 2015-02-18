using System;
using System.Net;
using System.Collections.Generic;
using System.Data;
using System.Data.Odbc;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.VisualBasic.FileIO;
namespace CSVImporte
{
    class Program
    {
        static void Main(string[] args)
        {
            InsertQuotes();        
        }

        private static void InsertQuotes() {
            //"value.id_str,value.utc_year,value.utc_month,value.utc_day,value.utc_hours,value.utc_minutes,value.text,value.match_key_1,value.match_key_2,value.match_key_3,value.match_key_4,value.match_key_5,value.match_key_6"
            var fileName = @"C:\data\quotes.csv";
            var createdCount = 0;
            var _truncateLiveTableCommandText = @"TRUNCATE TABLE full_quotes";
            var _batchSize = 100000;
            using (var textFieldParser = new TextFieldParser(fileName))
            {
                textFieldParser.TextFieldType = FieldType.Delimited;
                textFieldParser.Delimiters = new[] { "," };
                textFieldParser.HasFieldsEnclosedInQuotes = true;

                var dataTable = new DataTable("full_quotes");

                dataTable.Columns.Add("symbol");
                dataTable.Columns.Add("trade_price");
                dataTable.Columns.Add("change");
                dataTable.Columns.Add("change_in_percent");
                dataTable.Columns.Add("average_daily_volume");
                dataTable.Columns.Add("year");
                dataTable.Columns.Add("month");
                dataTable.Columns.Add("day");
                dataTable.Columns.Add("hour");
                dataTable.Columns.Add("minute");

                using (var sqlConnection = new SqlConnection("data source=BUFFALO-PC;initial catalog=birddog;integrated security=True;"))
                {
                    sqlConnection.Open();

                    // Truncate the live table
                    using (var sqlCommand = new SqlCommand(_truncateLiveTableCommandText, sqlConnection))
                    {
                        sqlCommand.ExecuteNonQuery();
                    }

                    // Create the bulk copy object
                    var sqlBulkCopy = new SqlBulkCopy(sqlConnection)
                    {
                        DestinationTableName = "full_quotes"
                    };

                    // Setup the column mappings, anything ommitted is skipped
                    sqlBulkCopy.ColumnMappings.Add("symbol", "symbol");
                    sqlBulkCopy.ColumnMappings.Add("trade_price", "trade_price");
                    sqlBulkCopy.ColumnMappings.Add("change", "change");
                    sqlBulkCopy.ColumnMappings.Add("change_in_percent", "change_in_percent");
                    sqlBulkCopy.ColumnMappings.Add("average_daily_volume", "average_daily_volume");

                    sqlBulkCopy.ColumnMappings.Add("year", "year");
                    sqlBulkCopy.ColumnMappings.Add("month", "month");
                    sqlBulkCopy.ColumnMappings.Add("day", "day");
                    sqlBulkCopy.ColumnMappings.Add("hour", "hour");
                    sqlBulkCopy.ColumnMappings.Add("minute", "minute");

                    // Loop through the CSV and load each set of 100,000 records into a DataTable
                    // Then send it to the LiveTable
                    textFieldParser.ReadFields(); //skip first line
                    var strings = new List<string>();
                    while (!textFieldParser.EndOfData)
                    {
                        var fields = textFieldParser.ReadFields();
                        dataTable.Rows.Add(fields[0], double.Parse(fields[1]), fields[2], fields[3], int.Parse(fields[4]),
                            (int)double.Parse(fields[5]), (int)double.Parse(fields[6]) + 1, (int)double.Parse(fields[7]), (int)double.Parse(fields[8]), (int)double.Parse(fields[9]));

                        createdCount++;

                        if (createdCount % _batchSize == 0)
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
        private static void InsertTweets() {
            //"value.id_str,value.utc_year,value.utc_month,value.utc_day,value.utc_hours,value.utc_minutes,value.text,value.match_key_1,value.match_key_2,value.match_key_3,value.match_key_4,value.match_key_5,value.match_key_6"
            var fileName = @"C:\data\tweets.csv";
            var createdCount = 0;
            var _truncateLiveTableCommandText = @"TRUNCATE TABLE full_tweets";
            var _batchSize = 100000;
            using (var textFieldParser = new TextFieldParser(fileName))
            {
                textFieldParser.TextFieldType = FieldType.Delimited;
                textFieldParser.Delimiters = new[] { "," };
                textFieldParser.HasFieldsEnclosedInQuotes = true;

                var dataTable = new DataTable("full_tweets");

                dataTable.Columns.Add("id_str");
                dataTable.Columns.Add("year");
                dataTable.Columns.Add("month");
                dataTable.Columns.Add("day");
                dataTable.Columns.Add("hour");
                dataTable.Columns.Add("minute");
                dataTable.Columns.Add("text");
                dataTable.Columns.Add("key1");
                dataTable.Columns.Add("key2");
                dataTable.Columns.Add("key3");
                dataTable.Columns.Add("key4");
                dataTable.Columns.Add("key5");
                dataTable.Columns.Add("key6");
                using (var sqlConnection = new SqlConnection("data source=BUFFALO-PC;initial catalog=birddog;integrated security=True;"))
                {
                    sqlConnection.Open();

                    // Truncate the live table
                    using (var sqlCommand = new SqlCommand(_truncateLiveTableCommandText, sqlConnection))
                    {
                        sqlCommand.ExecuteNonQuery();
                    }

                    // Create the bulk copy object
                    var sqlBulkCopy = new SqlBulkCopy(sqlConnection)
                    {
                        DestinationTableName = "full_tweets"
                    };

                    // Setup the column mappings, anything ommitted is skipped
                    sqlBulkCopy.ColumnMappings.Add("id_str", "id_str");
                    sqlBulkCopy.ColumnMappings.Add("year", "year");
                    sqlBulkCopy.ColumnMappings.Add("month", "month");
                    sqlBulkCopy.ColumnMappings.Add("day", "day");
                    sqlBulkCopy.ColumnMappings.Add("hour", "hour");
                    sqlBulkCopy.ColumnMappings.Add("minute", "minute");
                    sqlBulkCopy.ColumnMappings.Add("text", "text");
                    sqlBulkCopy.ColumnMappings.Add("key1", "key1");
                    sqlBulkCopy.ColumnMappings.Add("key2", "key2");
                    sqlBulkCopy.ColumnMappings.Add("key3", "key3");
                    sqlBulkCopy.ColumnMappings.Add("key4", "key4");
                    sqlBulkCopy.ColumnMappings.Add("key5", "key5");
                    sqlBulkCopy.ColumnMappings.Add("key6", "key6");

                    // Loop through the CSV and load each set of 100,000 records into a DataTable
                    // Then send it to the LiveTable
                    textFieldParser.ReadFields(); //skip first line
                    var strings = new List<string>();
                    while (!textFieldParser.EndOfData)
                    {
                        var fields = textFieldParser.ReadFields();
                        dataTable.Rows.Add(fields[0], (int)double.Parse(fields[1]), (int)double.Parse(fields[2]), (int)double.Parse(fields[3]), (int)double.Parse(fields[4]),
                            (int)double.Parse(fields[5]), WebUtility.HtmlDecode(fields[6]), fields[7], fields[8], fields[9], fields[10], fields[11], fields[12]);
                        //strings.Add(WebUtility.HtmlDecode(fields[6]));
                        createdCount++;

                        //var maxLength = strings.Where(x => x.Length > 140);
                        if (createdCount % _batchSize == 0)
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
