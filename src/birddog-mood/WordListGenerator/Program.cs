using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.IO;
using LAIR.Collections.Generic;
using LAIR.ResourceAPIs.WordNet;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using MoodFinder.Domain;
using MoodFinder.StringMatching;

namespace ConsoleApplication1
{
    class Program
    {
        private static WordNetEngine _wordNetEngine;

        static void Main(string[] args)
        {
            BingLiuGenerate();

        }
        private static void BingLiuGenerate()
        {

            string line;
            var moods = new List<MoodItem>();
            using (var reader = File.OpenText("positive-words.txt"))
            {
                while ((line = reader.ReadLine()) != null)
                {
                    moods.Add(new MoodItem
                    {
                        Word = line,
                        Value = new MoodValue { Category = "Positive", Weight = 1 }
                    });
                }
            }
            using (var reader = File.OpenText("negative-words.txt"))
            {
                while ((line = reader.ReadLine()) != null)
                {
                    moods.Add(new MoodItem
                    {
                        Word = line,
                        Value = new MoodValue { Category = "Negative", Weight = 1 }
                    });
                }
            }

            StreamWriter file2 = new StreamWriter("c:\\dev\\files.txt", true);

            foreach (var mood in moods)
            {
                file2.WriteLine("new MoodItem{   Word = \"" + mood.Word + "\", Value = new MoodValue { Category =\"" + mood.Value.Category + "\", Weight = " + mood.Value.Weight + " } },");
            }

            file2.Close();
        }
        private static void DrummondsGenerate()
        {
            var stemmer = new Stemming();

            string line;
            var moods = new List<MoodItem>();
            using (var reader = File.OpenText("wordlist.txt"))
            {
                string word;
                string category;
                while ((line = reader.ReadLine()) != null)
                {
                    var split = line.Split(',');
                    if (split.Length >= 2)
                    {
                        double weight = 1;
                        if (split.Length > 2)
                        {
                            weight = double.Parse(split[2]);
                        }

                        moods.Add(new MoodItem
                        {
                            Word = stemmer.Stem(split[0].ToLower()),
                            Value = new MoodValue { Category = split[1], Weight = weight }
                        });
                    }
                }
            }


            StreamWriter file2 = new StreamWriter("c:\\code\\files.txt", true);

            foreach (var mood in moods)
            {
                file2.WriteLine("new MoodItem{   Word = \"" + mood.Word + "\", Value = new MoodValue { Category =\"" + mood.Value.Category + "\", Weight = " + mood.Value.Weight + " } },");
            }

            file2.Close();
        }

        private static List<string> getSynSets(string word, WordNetEngine.POS type)
        {
            Set<SynSet> synSetsToShow = null;

            try
            {
                synSetsToShow = _wordNetEngine.GetSynSets(word, type);

            }
            catch (Exception)
            {
                return null;
            }
            var returnList = new List<string>();
            foreach (var syns in synSetsToShow)
            {
                returnList.AddRange(syns.Words);
            }
            returnList = returnList.Distinct().ToList();

            foreach (var returnListItem in returnList.ToList())
            {
                try
                {
                    synSetsToShow = _wordNetEngine.GetSynSets(returnListItem, type);

                }
                catch (Exception)
                {
                    return null;
                }
                foreach (var syns in synSetsToShow)
                {
                    returnList.AddRange(syns.Words);
                }
            }
            returnList = returnList.Distinct().ToList();

            return returnList;
        }



    }
    public class StemmingRule
    {
        public string Suffix { get; set; }
        public string Result { get; set; }
        public int Number { get; set; }
    }
    public class MoodItem
    {
        public string Word { get; set; }
        public MoodValue Value { get; set; }

    }
    public class MoodValue
    {
        public string Category { get; set; }
        public double Weight { get; set; }
    } 
}
