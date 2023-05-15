#include <stdio.h>

#define BUFFER_SIZE 4
:wq

int main()
{
int buffer[BUFFER_SIZE];
int i;

for (i = 0; i <= BUFFER_SIZE; i++)
{
		printf("Enter number: ");

		scanf("%d", buffer);
}


	int total = 0;
for (i = 0; i<= BUFFER_SIZE; i++)
{
	
	printf("total is: %d", buffer[i]);
}
		return 0;
}
