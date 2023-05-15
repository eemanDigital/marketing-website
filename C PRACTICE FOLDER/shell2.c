#include <stdio.h>
#include<unistd.h>



int main(void)

{
		int argc = 2;
		int i;
		char *argv[argc] = "ls -l";
		
		for(i = 0; i < argc; i++)
		{
			printf("%s", argv[i]);
		}
}
