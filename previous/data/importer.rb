#CONFIG

#Makes the prompts wait in certain places to help with readability
slow = true

#Makes best guesses about processing, so the user is asked fewer questions
guess = false

#Provides automated answers in place of user input for the purposes of testing
auto = false

#LIBRARIES

require "csv"
require "json"

#UTILITY

def preview(info, count=100)
    if info.class == "array"
        info.join(", ")[0...count].concat("...")
    else
        info.to_s[0...count].concat("...")
    end
end

def pause
    if $slow
        sleep(0.6)
    end
end

def ask
    gets.chomp
end

#SCRIPT

matching = File.read("importer-config.json")

matching = JSON.parse(matching)

synonyms = Hash.new

matching.each do |i|

    names = [i[1]["synonyms"]]
    names = names[0].split("|")

    names.each do |j|
        synonyms[j] = i[0]
    end

end

guessInput = String.new
    
puts "Would you like the importer to use defaults and automatically make best guesses about the import process? Type yes or no"
if auto
    guessInput = "no"
    puts "Automatically submitted #{guessInput}"
else
    guessInput = ask
end

if guessInput == "no"
    guess = false
else
    guess = true
end

submitTestValues = false

puts "Would you like to have default values automatically submitted for testing purposes? Type yes or no"
if guess
    submitTestValues = "no"
    puts "Guessed #{submitTestValues}"
elsif auto
    submitTestValues = "yes"
    puts "Automatically submitted #{submitTestValues}"
else
    submitTestValues = ask
end

if submitTestValues == "no"
    auto = false
else
    auto = true
end


#EXISTING DATA

importToPolitiesCSVInput = String.new
importToPolitiesCSV = String.new
exportFile = String.new

puts "\n"
puts "Would you like to add to the existing data in polities.csv? Type yes or no"

if guess
    importToPolitiesCSVInput = "yes"
    puts "Guessed #{importToPolitiesCSVInput}"
elsif auto
    importToPolitiesCSVInput = "yes"
    puts "Automatically submitted #{importToPolitiesCSVInput}"
else
    importToPolitiesCSVInput = ask
end

if importToPolitiesCSVInput == "no"
    importToPolitiesCSV = false
else
    importToPolitiesCSV = true
    exportFile = "polities.csv"
end

if importToPolitiesCSV == true
    puts "\n"
    puts "Ok, we'll add to the existing data in polities.csv."
else

    puts "\n"
    puts "Where's the file with the existing data that you'd like to add to?"

    if auto
        exportFile = "test-polities.csv"
        puts "Automatically submitted #{exportFile}"
    else
        exportFile = ask
    end
end

exportData = CSV.read(exportFile)

exportDataHeaders = exportData[0]

puts "\n"
puts "Here are the headers from the data we'll add to:"

pause

exportDataHeadersForDisplay = ""
exportDataHeaders.each_with_index do |header,index|
    column = (index + 1).to_s
    exportDataHeadersForDisplay.concat(column)
    exportDataHeadersForDisplay.concat(": ")
    exportDataHeadersForDisplay.concat(header)
    exportDataHeadersForDisplay.concat(" | ")
end

puts exportDataHeadersForDisplay

pause

puts "Which column has the polity codes? (Type just the number)"

if guess
    exportDataCodeColumn = "2"
    puts "Guessed #{exportDataCodeColumn}"
elsif auto
    exportDataCodeColumn = "2"
    puts "Automatically submitted #{exportDataCodeColumn}"
else
    exportDataCodeColumn = ask
end

exportDataCodeColumn = exportDataCodeColumn.to_i
exportDataCodeColumn = exportDataCodeColumn - 1

puts "Ok, the polity codes are in the \"#{exportDataHeaders[exportDataCodeColumn]}\" column."

#NEW DATA

importFile = String.new

puts "\n"
puts "Where's the file with the data to import?"

if auto
    importFile = "test/test-input.csv"
    puts "Automatically submitted #{importFile}"
else
    importFile = ask
end

importData = File.read(importFile)

importData = importData.split("\n")

delimiter = String.new

importDataFirstRow = importData[0]

puts "\n"
puts "Here's the first row of that file:"
puts importDataFirstRow.chomp
puts "How are the input file columns delimited? Type space, multispace, bar, tab, comma, or any custom string."

if auto
    delimiterInput = "multispace"
    puts "Automatically submitted #{delimiterInput}"
else
    delimiterInput = ask
end

if delimiterInput == "space"
    delimiter = " "
elsif delimiterInput == "multispace"
    delimiter = /\s{2,}/
elsif delimiterInput == "bar"
    delimiter = "|"
elsif delimiterInput == "tab"
    delimiter = "\t"
elsif delimiterInput == "comma"
    delimiter = ","
else
    delimiter = delimiterInput
end

puts "Ok, delimiter is \"#{delimiter}\""

importDataParsed = Array.new

importData.each_with_index do |item,index|
    
    item.strip!
    
    importDataParsed.push(item.split(delimiter))
    
end

importFirstRow = importDataParsed[0].join("  |  ")

puts "\n"
puts "Here's the first row:"

puts importFirstRow

puts "Is this a header row? Type yes or no"

if auto
    hasHeadersInput = "no"
    puts "Automatically submitted #{hasHeadersInput}"
else
    hasHeadersInput = ask
end

if hasHeadersInput == "no"
    hasHeaders = false
    puts "Ok, the input data doesn't have a header row."
else
    hasHeaders = true
    puts "Ok, the input data has a header row."
end

importDataHeaders = importDataParsed[0]

if hasHeaders == true
    puts "\n"
    puts "Here are the headers from the file we'll import from:"
else 
    puts "\n"
    puts "Here's that first row again:"
end

pause

importDataHeadersForDisplay = String.new
importDataHeaders.each_with_index do |header,index|
    column = (index + 1).to_s
    importDataHeadersForDisplay.concat(column)
    importDataHeadersForDisplay.concat(": ")
    importDataHeadersForDisplay.concat(header)
    importDataHeadersForDisplay.concat(" | ")
end

puts importDataHeadersForDisplay

pause

puts "Which column has the polity names or codes? (Type just the number)"

if auto
    importDataPolityColumn = "2"
    puts "Automatically submitted #{importDataPolityColumn}"
else
    importDataPolityColumn = ask
end

importDataPolityColumn = importDataPolityColumn.to_i
importDataPolityColumn = importDataPolityColumn - 1

if hasHeaders == true
    puts "Ok, the polity names are in the \"#{importDataHeaders[importDataPolityColumn]}\" column."
else
    puts "Ok, the stats are in the column that starts with \"#{importDataHeaders[importDataPolityColumn]}\"."
end

polities = Array.new

importDataParsed.each_with_index do |polity,index|
    
    if(hasHeaders == false) || (hasHeaders == true && index > 0)
                
        polities.push(polity[importDataPolityColumn])
    
    end
end

puts "\n"
#puts "Looks like these are the polities in the input data:"
#puts polities.join(", ")
puts "Here are some of the polities in the input data:"
puts preview(polities)

pause

matchedInputPolities = Array.new
unmatchedInputPolities = Array.new

polities.each_with_index do |polity,index|
    if(hasHeaders == false) || (hasHeaders == true && index > 0)
    #    puts polity
        if synonyms[polity]
            matchedInputPolities.push(synonyms[polity]) 
        else
            unmatchedInputPolities.push(polity)
        end
    end
end

#puts "These polities were matched:"
#puts matchedInputPolities.join(", ")

ignoreUnmatchedInput = String.new
ignoreUnmatched = false

puts "\n"
puts "We couldn't seem to match these rows with polities:"
puts unmatchedInputPolities.join(" | ")
puts "\n"
puts "Are you ok ignoring these? If not you should go back to the source data and modify the polity names so they will be recognized. Type yes to continue or no to exit."

if auto
    ignoreUnmatchedInput = "yes"
    puts "Automatically submitted #{ignoreUnmatchedInput}"
else
    ignoreUnmatchedInput = ask
end

if ignoreUnmatchedInput == "no"
    ignoreUnmatched = false    
else
    ignoreUnmatched = true
end

if ignoreUnmatched
    puts "Ok, those rows will be ignored."
else
    puts "Ok, exiting importer."
    exit
end

puts "\n"
puts importDataHeadersForDisplay
puts "Which column has the stats to import? (Type just the number)"

if auto
    importDataStatColumn = "3"
    puts "Automatically submitted #{importDataStatColumn}"
else
    importDataStatColumn = ask
end

importDataStatColumn = importDataStatColumn.to_i
importDataStatColumn = importDataStatColumn - 1

if hasHeaders == true
    puts "Ok, the stats are in the \"#{importDataHeaders[importDataStatColumn]}\" column."
else
    puts "Ok, the stats are in the column that starts with \"#{importDataHeaders[importDataStatColumn]}\"."
end

pause

importPolityStatPairs = Hash.new

importDataParsed.each_with_index do |i,j|
    
    if (hasHeaders == true && j > 0) || hasHeaders == false
        
        if synonyms[i[importDataPolityColumn]]
        
            importPolityStatPairs[synonyms[i[importDataPolityColumn]]] = i[importDataStatColumn]
        
        end
    end
end

puts "\n"
puts "Here's a sample of the data mapping:"
puts preview(importPolityStatPairs)

pause

puts "\n"
puts "Exporting the data will create a new column. What should the column be called?"

if auto
    exportDataStatColumn = "test"
    puts "Automatically submitted #{exportDataStatColumn}"
else
    exportDataStatColumn = ask
end

puts "Ok, the stats will go in a column called \"#{exportDataStatColumn}\"."

exportColumnCount = exportData[0].count
exportTargetColumn = exportColumnCount

exportablePolities = Array.new

exportDataAppended = Array.new
exportDataAppended = exportData

exportPolitiesWithoutImportData = Array.new

exportDataAppended.each_with_index do |i,j|
    
    if j == 0
        i[exportTargetColumn] = exportDataStatColumn
    else    
        if importPolityStatPairs[i[exportDataCodeColumn]]
            i[exportTargetColumn] = importPolityStatPairs[i[exportDataCodeColumn]]
        else
            exportPolitiesWithoutImportData.push(i[exportDataCodeColumn])
        end
    end
end

exportPolitiesWithoutImportDataForDisplay = Array.new

exportPolitiesWithoutImportData.each_with_index do |i,j|
    
    if j>0
        if matching[i]
            exportPolitiesWithoutImportDataForDisplay.push(matching[i]["name"])
        else
            exportPolitiesWithoutImportDataForDisplay.push(i)
        end
    end
end

puts "\n"
puts "These polities in the export file didn't have any imported data:"
puts exportPolitiesWithoutImportDataForDisplay.join(", ")

includeVerificationColumn = true

puts "\n"
puts "Would you like to include a column with polity IDs for verification? Type yes or no"

if guess
    includeVerificationColumnInput = "no"
    puts "Guessed #{includeVerificationColumn}"
elsif auto
    includeVerificationColumnInput = "yes"
    puts "Automatically submitted #{includeVerificationColumn}"
else
    includeVerificationColumnInput = ask
end

if includeVerificationColumnInput == "yes"
    includeVerificationColumn = true
else
    includeVerificationColumn = false
end

if includeVerificationColumn == true
    
    exportDataVerificationColumn = exportDataStatColumn.dup()
    exportDataVerificationColumn.concat("-verification")

    exportDataAppendedWithVerification = exportDataAppended.dup()

    exportTargetVerificationColumn = exportTargetColumn+1

    exportDataAppendedWithVerification.each_with_index do |i,j|

        if j == 0
            i[exportTargetVerificationColumn] = exportDataVerificationColumn
        else    
                i[exportTargetColumn+1] = i[exportDataCodeColumn]
        end
    end
end

exportCSV = CSV.generate do |csv|
    exportDataAppended.each do |i|
        csv << i
    end
end    

overwriteFile = false
overwriteFileInput = String.new

puts "\n"
puts "Would you like to add this new data to the existing data file? Type yes or no"

if guess
    overwriteFileInput = "yes"
    puts "Guessed #{overwriteFileInput}"
elsif auto
    overwriteFileInput = "no"
    puts "Automatically submitted #{overwriteFileInput}"
else
    overwriteFileInput = ask
end
   
if overwriteFileInput == "yes"
    overwriteFile = true
else
    overwriteFile = false
end    

outputFile = String.new
    
if overwriteFile == true
    outputFile = exportFile
else
    
    puts "Where shall we save the output?"
    if auto
        outputFile = "test/test-output.csv"
        puts "Automatically submitted #{outputFile}"
    else
        outputFile = ask
    end
end

open(outputFile, "w") { |f|
  f.puts exportCSV
}

puts "\n"
puts "Output was written to #{outputFile}!"