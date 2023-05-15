#include <stdio.h>
#include<unistd.h>

int main()
{
	pid_t pid;
	pid_t ppid;

	pid = fork();

	if(pid == -1)
	{
	printf("Not successful");
	return 1;
	}
	if(pid ==0)
	{
	sleep(3);
	printf("This is child\n");
	}
	else
	{
	ppid = getppid();
	printf("This is Parent PPID:%u\n", ppid);
	}
	return 0;
}
