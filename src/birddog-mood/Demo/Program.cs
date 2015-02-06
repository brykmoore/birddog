using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Iveonik.Stemmers;
using MoodFinder;
using MoodFinder.Domain;
using MoodFinder.StringMatching;

namespace Demo
{
    public static class EntityFrameworkUtil
    {
        public static IEnumerable<T> QueryInChunksOf<T>(this IQueryable<T> queryable, int chunkSize)
        {
            return queryable.QueryChunksOfSize(chunkSize).SelectMany(chunk => chunk);
        }

        public static IEnumerable<T[]> QueryChunksOfSize<T>(this IQueryable<T> queryable, int chunkSize)
        {
            int chunkNumber = 0;
            while (true)
            {
                var query = (chunkNumber == 0)
                    ? queryable
                    : queryable.Skip(chunkNumber * chunkSize);
                var chunk = query.Take(chunkSize).ToArray();
                if (chunk.Length == 0)
                    yield break;
                yield return chunk;
                chunkNumber++;
            }
        }
    }

    class Program
    {
        static void Main(string[] args)
        {
            using (var db = new birddogEntities())
            {
                db.tweet
                var count = 0;
                foreach (var item in db.OrderBy(x=>x.id_str).QueryInChunksOf(1000)) 
                {

                    //var returnValue = process(item.text);
                    var positive = 1;// returnValue.Where(x => x.Category == "Positive");
                    var negative = 1;// returnValue.Where(x => x.Category == "Negative");
                    if (positive != null)
                    {
                        item.bing_positive = 1;//(int)positive.First().Count;
                    }
                    if (negative != null) 
                    {
                        item.bing_negative = 1;//(int)negative.First().Count;
                    }
                    db.SaveChanges();
                }

            }
        }

        public static List<MoodFrequencyItem> process(string text){

            //lowercase
            text = text.ToLower();
            //strip punctuation
            text = new string(text.Where(x => !char.IsPunctuation(x)).ToArray());
            //var stemmer = new EnglishStemmer();

            var stemmer = new Stemming();
            var trie = new Trie<MoodValue>();
            var moodList = new MoodListing().BingLiuMoodList;

            foreach (var item in moodList)
            {
                trie.Add(stemmer.Stem(item.Word), item.Value);
            }

            trie.Build();

            var matches = Regex.Matches(text, @"((\b[^\s]+\b)((?<=\.\w).)?)");
            var inputString = "";

            foreach (var item in matches)
            {
                inputString += stemmer.Stem(item.ToString()) + " ";
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
