#include<fcntl.h>
#include<stdio.h>
#include<sys/types.h>
#include<sys/stat.h>
#include<unistd.h>
#include<string.h>
#include<time.h>



	char* get_timestamp()

{
	time_t now = time(NULL);

	return asctime(localtime(&now));

}
	
int main(int argc, char **argv)
{

	/***OPENING FILE***/

	/*path to create new file*/

//char* path = argv[1];

	/*permision for new file*/

//	mode_t mode = S_IRUSR | S_IWUSR | S_IRGRP | S_IROTH;

	/**creat your file**/
//	int fd = open(path, O_WRONLY | O_EXCL | O_CREAT, mode);

//	if(fd == -1)
//	{
//		perror("Open");
//		return 1;
//	}

//	return 0;
	

		/***WRITING INTO FILE***/

	
/**the file to which to append the timestamp**/

	char* filename = argv[1];

	/* get current timestamp */

	char* timestamp = get_timestamp();

	/*Open the file for writing. If it exists, append to it; otherwise, cerat a new file */

	int fd = open (filename, O_WRONLY | O_CREAT | O_APPEND, 0666);

	/* compute the lenght of timestamp string */

	size_t length = strlen(timestamp);

	/* write the timestamp to the file */

	write(fd, timestamp, length);

	/* All done */

	close (fd);

	return 0;

}
