using System;
using System.Collections.Generic;
using java.io;
using java.util;
using edu.stanford.nlp.ling;
using edu.stanford.nlp.tagger.maxent;
using Console = System.Console;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PosTagger2
{
    class Program
    {
        static void Main(string[] args)
        {
            var jarRoot = @"F:\Downloads\stanford-postagger-full-2015-01-30";
            var modelsDirectory = jarRoot + @"\models";

            // Loading POS Tagger
            var tagger = new MaxentTagger(modelsDirectory + @"\wsj-0-18-bidirectional-nodistsim.tagger");

            // Text for tagging
            var text = "I'm not happy.";

            var sentences = MaxentTagger.tokenizeText(new StringReader(text)).toArray();
            foreach (ArrayList sentence in sentences)
            {
                var taggedSentence = tagger.tagSentence(sentence);
                Iterator it = taggedSentence.iterator();
                while (it.hasNext())
                {
                    var item = it.next().ToString();
                    var split = item.Split('/');
                    var word = split[0];
                    var pos = split[1];
                    Console.WriteLine("Word:" + word + " POS:" + pos);
                }

                Console.ReadLine();
            }
        }
    }
}
