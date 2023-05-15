#include<stdio.h>
#include<unistd.h>

int main()
{

	/*initialising Pid*/
	pid_t pid;

	/*child process created*/
	pid = fork();
	
	/*if fork fails*/
	if (pid == -1)
	{
	printf("Program failed");
	return 1;
	}
	/*child process*/
	if(pid == 0)
	{
			printf("i am the child\n");
	}

	/*Parent Process*/
	else
	{
			sleep(40);
			printf("I am the parent process");
	}
	return 0;
}
