#include <fcntl.h>
#include <stdio.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <unistd.h>

int main(int argc, char* argv[])
{

	unsigned char buffer[16];
	size_t  offset = 0;
	size_t bytes_read;
	int i;

	/*open file for reading*/
	int fd = open (argv[1], O_RDONLY);

	/** read from the file, one chunck at a time
	continue until read "come up short" that is less
	than we asked for. it indicate that we've hit the end of the file**/
	do{
		/*read the next line worth of bytes*/
		bytes_read = read(fd, buffer, sizeof(buffer));

		/**print the offset in the file, followed by the bytes themselves**/
		printf("0x%06zx: ", offset);
		for(i=0;i<bytes_read; i++)
			printf("%02x", buffer[i]);
		printf("\n");
	}while(bytes_read == sizeof(buffer));

	close(fd);

	return 0;
}
