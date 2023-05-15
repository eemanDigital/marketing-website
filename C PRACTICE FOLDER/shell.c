#include <stdio.h>
#include<unistd.h>
#include <sys/types.h>
#include <sys/wait.h>
#include<stdlib.h>
#include <string.h>

int main(void)
{

		/************USING EXECVE()**************/
/*	pid_t pid;

	char *argv[] = {"/bin/ls", "-l", NULL};
	pid = fork();

	if(pid == -1)
		return -1;

	if(pid == 0)
	{
	int val = execve(argv[0], argv, NULL);

				if(val == -1)
					perror("Error");
	}
	else
	{
			wait(NULL);
			printf("Done with exec");
	}
	return 0;*/


	/**********USING GETLINE()***************/
	/*	size_t n = 10;

	//	char *buf = malloc(sizeof(char) * n);
		char *buf = NULL;
		printf("Enter name: ");

		getline(&buf, &n, stdin);
		
		printf("Name is %s  buffer size is %ld\n", buf, n);

		free(buf);*/

	
	/*********USING STRTOK()*********/

	char str[] = "Lukman is my token";

	char *delim = " ";
	char *token;

	token = strtok(str, delim);
	/*	//prints first string, Lukma Not a good practice/	
		printf("token 2:%s", token);


		//to print subsequent token: calls one after the other. Not a good practice.
		token= strtok(NULL, delim);
*/
		while(token)
		{
		printf("token 2: %s", token);
		token = strtok(NULL, delim);
		}
	return 0;
}
