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
            const string connection = "data source=BUFFALO-SOLDIER;initial catalog=birddog;integrated security=True;";
            var db = new DataAccess(connection);
            _process_with_BingLiu = true;
            _process_with_Drummond = true;
            var startTime = DateTime.Now;

            //Stemming Setup
            Stemming_Setup();
            var count = db.GetCount();
            var batchSize = 500000;
            var rounds = (count / batchSize) + 1;

            
            #region truncate tables
            var _truncateTweetMoodsCommandText = @"TRUNCATE TABLE tweet_moods";
            db.ExecuteNonQuery(_truncateTweetMoodsCommandText);
            #endregion

            //batch process the tweets
            #region batch process
            for (int i = 0; i < rounds; i++)
            {
                var tweetList = db.ExecuteTweetBatchRead(i, batchSize);

                var concurrentTweets = new ConcurrentBag<fulltweets>();
                Parallel.ForEach(tweetList, item =>
                {
                    concurrentTweets.Add(process(item));
                });

                Console.WriteLine(DateTime.Now - startTime);

                db.BatchWrite(concurrentTweets);
            }
            #endregion

            #region Update from Temp Table

            var updateQuery = @"UPDATE birddog.dbo.full_tweets
            SET birddog.dbo.full_tweets.bing_negative = birddog.dbo.tweet_moods.bing_negative,
            birddog.dbo.full_tweets.bing_positive = birddog.dbo.tweet_moods.bing_positive,
            birddog.dbo.full_tweets.D_Anger = birddog.dbo.tweet_moods.D_Anger,
            birddog.dbo.full_tweets.D_Caring = birddog.dbo.tweet_moods.D_Caring,
            birddog.dbo.full_tweets.D_Confusion = birddog.dbo.tweet_moods.D_Confusion,
            birddog.dbo.full_tweets.D_Depression = birddog.dbo.tweet_moods.D_Depression,
            birddog.dbo.full_tweets.D_Fear = birddog.dbo.tweet_moods.D_Fear,
            birddog.dbo.full_tweets.D_Happiness = birddog.dbo.tweet_moods.D_Happiness,
            birddog.dbo.full_tweets.D_Hurt = birddog.dbo.tweet_moods.D_Hurt,
            birddog.dbo.full_tweets.D_Inadequateness = birddog.dbo.tweet_moods.D_Inadequateness,
            birddog.dbo.full_tweets.D_Loneliness = birddog.dbo.tweet_moods.D_Loneliness,
            birddog.dbo.full_tweets.D_Remorse = birddog.dbo.tweet_moods.D_Remorse
            FROM birddog.dbo.full_tweets JOIN birddog.dbo.tweet_moods
            ON birddog.dbo.full_tweets.id = birddog.dbo.tweet_moods.id";

            db.ExecuteNonQuery(updateQuery);

            #endregion
        }


        private static void Stemming_Setup()
        {
            stemmer = new Stemming();
            moodList = new MoodListing().BingLiuMoodList;
            bingliuTrie = new Trie<MoodValue>();
            var bingLiuMoodList = new List<MoodItem>();
            foreach (var item in moodList)
            {
                //var stemmed = stemmer.Stem(item.Word);
                bingLiuMoodList.Add(new MoodItem { Word = " " + item.Word + " ", Value = item.Value });
            }

            bingLiuMoodList = bingLiuMoodList.Distinct().ToList();

            foreach (var item in bingLiuMoodList)
            {
                bingliuTrie.Add(item.Word, item.Value);
            }

            bingliuTrie.Build();

            drummondMoodList = new MoodListing().DrummondMoodList;
            drummondTrie = new Trie<MoodValue>();
           
            foreach (var item in drummondMoodList)
            {
                var stemmed = stemmer.Stem(item.Word);
                drummondTrie.Add(" " + stemmed, item.Value);
            }

            drummondTrie.Build();
        }


        private static int getmood(List<MoodFrequencyItem> list, string mood)
        {
            var result = list.Where(x => x.Category == mood).ToList();
            if (result != null && result.Count > 0)
            {
                return (int)result.First().Count;
            }
            return 0;
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

            #region BingLiu
            if (_process_with_BingLiu)
            { 
                var returnValue = processBingLiu(inputString);
                item.bing_positive = getmood(returnValue, "Positive");
                item.bing_negative = getmood(returnValue, "Negative");
            }
            #endregion
            #region Drummond
            if (_process_with_Drummond)
            {
                var returnValue = processDrummond(inputString);
                item.D_Happiness = getmood(returnValue, "Happiness");
                item.D_Caring = getmood(returnValue, "Caring");
                item.D_Depression = getmood(returnValue, "Depression");
                item.D_Inadequateness = getmood(returnValue, "Inadequateness");
                item.D_Fear = getmood(returnValue, "Fear");
                item.D_Confusion = getmood(returnValue, "Confusion");
                item.D_Hurt = getmood(returnValue, "Hurt");
                item.D_Fear = getmood(returnValue, "Fear");
                item.D_Anger = getmood(returnValue, "Anger");
                item.D_Loneliness = getmood(returnValue, "Loneliness");
                item.D_Remorse = getmood(returnValue, "Remorse");               
            }
            #endregion
            return item;

        }

        private static Trie<MoodValue> bingliuTrie;
        private static Trie<MoodValue> drummondTrie;
        private static List<MoodItem> drummondMoodList;
        private static Stemming stemmer;
        private static List<MoodItem> moodList;
        private static bool _process_with_Drummond;
        private static bool _process_with_BingLiu;
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
