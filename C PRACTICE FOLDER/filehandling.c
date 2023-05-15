#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void main(void)
{
    FILE *fptr = NULL;

    char str[50];
    int i;

       fptr = fopen("test.txt", "w");

       if(fptr == NULL)
       {
       printf("Error, file empty");
       exit(1);
       }
       printf("Enter char");
       gets(str);

       for(i=0; i<=strlen(str); i++)
       fputc(str[i], fptr);

       fclose(fptr);

}