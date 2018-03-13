import re, sys, os
from os import listdir, stat, makedirs, rename
from os.path import isfile, join, getmtime, join, exists
from time import gmtime, strftime
try:
	from colorama import Fore, Style
except:
	print "Note: Colorama library not found."
	print "Please consider installing Colorama for nicer terminal output.\n"
	# Overwrite colorama class/attributes
	class Fore():
		RED = ""
		GREEN = ""
		YELLOW = ""
	class Style():
		RESET_ALL = ""


DATA_DIR = 'annotated_data/'
OLD_DIR = 'old_versions'
OUTPUT_DIR = "merged_data"
OUTPUT_FILE = "annotated_data_merged.txt"

# Finds the first and last file in the annotated data folder. Return a the first index, last index, and a list of group indexes present in the folder.
def find_range(files):
	def find_end(f):
		try:
			try:
				i = f.index(" (")
			except:
				i = f.index("(")
		except:
			try:
				i = f.index(".txt")
			except:
				raise ValueError
		return i
	try:
		group_indexes = set([int(f[len("annotated_data_"):find_end(f)]) for f in files])
	except ValueError:
		sys.stdout.write(Fore.RED + "ERROR: " + Style.RESET_ALL + "invalid file found in the %s directory. Please ensure all files have been generated by the web annotation tool." % DATA_DIR)
		sys.stdout.write("\n       Specifically, they must all be of the format \"annotated_data_n\", \"annotated_data_n(m)\", or \"annotated_data_n (m)\", where n and m are numbers.")
		sys.exit(0)
	first_group_index = min(group_indexes)
	last_group_index  = max(group_indexes)
	return first_group_index, last_group_index, group_indexes

# Checks for any missing annotated data files based on the first and last group index.
def check_missing(first_group_index, last_group_index, group_indexes):
	for x in range(first_group_index, last_group_index):
		if x not in group_indexes:
			sys.stdout.write(Fore.YELLOW + "WARNING: " + Style.RESET_ALL + "annotated_data_%s not present in annotated_data folder.\n" % x)

# Finds the most up-to-date version of each annotated data file and return them as a set.
def find_final_versions(files, group_indexes):
	def last_modified(f):
		return stat(DATA_DIR + f)
	final_versions = set()
	old_versions = set()
	for i in group_indexes:
		regexp = re.compile(r'annotated_data_%s\D' % i)
		same_files = [f for f in files if regexp.search(f)]
		same_files.sort(key=lambda f: getmtime(join(DATA_DIR, f)), reverse=True)
		#print i, same_files
		final_versions.add(same_files.pop(0))
		old_versions.update(same_files)
		
	return final_versions, old_versions

# Moves the old versions of each annotated data file into the OLD folder.
def move_old_files_away(old_versions):
	if not exists(DATA_DIR + OLD_DIR):
		makedirs(DATA_DIR + OLD_DIR)
	for f in old_versions:
		try:
			rename(DATA_DIR + f, DATA_DIR + OLD_DIR + "/" + f)
		except:
			os.remove(DATA_DIR + OLD_DIR + "/" + f)
			rename(DATA_DIR + f, DATA_DIR + OLD_DIR + "/" + f)
			print "Replaced %s in the %s directory." % (f, OLD_DIR)
	if len(old_versions) > 0:
		sys.stdout.write("Moved %s files to the %s directory.\n" % (len(old_versions), OLD_DIR))

# Combines the final versions of each file and saves it to the output file.
# Appends the date and time if there is already an output file present.
def combine_final_versions(final_versions):
	if not exists(DATA_DIR + OUTPUT_DIR):
		makedirs(DATA_DIR + OUTPUT_DIR)
	output_filename = OUTPUT_FILE
	if exists(DATA_DIR + OUTPUT_DIR + "/" + OUTPUT_FILE):
		add_datetime = True
		datetime = strftime("%Y%m%d%H%M%S", gmtime())
		output_filename = OUTPUT_FILE[:-4] + "_" + datetime + ".txt"
	with open(DATA_DIR + OUTPUT_DIR + "/" + output_filename, 'w') as outfile:
		for f in final_versions:
			with open(DATA_DIR + f) as infile:
				for line in infile:
					outfile.write(line)	
	sys.stdout.write(Fore.GREEN + "SUCCESS: " + Style.RESET_ALL + "Merged %i files and saved to %s/%s." % (len(final_versions), OUTPUT_DIR, output_filename))

def main():
	if not exists(DATA_DIR):
		sys.stdout.write(Fore.RED + "ERROR: " + Style.RESET_ALL + "The %s directory is missing. Please create it and paste all of your annotated_data files in it." % DATA_DIR)

	files = [f for f in listdir(DATA_DIR) if isfile(join(DATA_DIR, f))]
	first_group_index, last_group_index, group_indexes = find_range(files)
	check_missing(first_group_index, last_group_index, group_indexes)
	final_versions, old_versions = find_final_versions(files, group_indexes)
	move_old_files_away(old_versions)
	combine_final_versions(final_versions)

if __name__ == "__main__":
	main()