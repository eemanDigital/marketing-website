#include <stdio.h>
#include <string.h>


int main()
{
    //char str1[] = {'l', 'u', 'k', 'm', 'a', 'n', '\0'};
   /* char name[78];
    int count = 0;
    int i = 0;

    printf("Enter a name\n ");
    gets(name);

    
   // printf("Your name is:%s\n", name);
    for (i = 0; i > name[56]; i++)
    {
        while (name[i] != '\0')
        {
            count++;
        i++;

        }

              printf("%d\n", count);

    }
    

   // count = strlen(name);
   // printf("%d\n", count);
   // puts(count);
    //puts(name);

    //printf("\n%d", str1);

*/

        /****************FINDING LENTH OF A STRING****************/
/*
char name[20], count, i;

printf("enter your name: ");
//scanf("%s", name);
gets(name); 

//finding length: hardcoding method
while(name[i] != '\0')
count++;
i++;
    
//using strlen to find length 
//unsigned int length = strlen(name);
printf("string printed: %s\n", name);
printf("length of string: %d", count);
 
 //start printing from third element: Adreess& sigmbol must be put
// printf("%s\n", &name[3]);

// puts(name);
// puts(name);
*/


/***********STRING CONCATENATION***********/

   /* char s1[30];
    char s2[10];
    char concat;

    /*****Using predefined function strcat()******/
/*printf("enter your s1, s2: ");
    scanf("%s", s1);
    scanf("%s", s2);

    strcat(s1, s2);
printf("strings concatenated: %s\n", s1 );


    /*****Hard coding******/
    
    char fname[30] = "Lukman";
    char lname[] = "Asinmi";
    int len1, len2, i;

    //find the length of the strings first
    len1 = strlen(fname);
    len2 = strlen(lname);

    for(i = 0; i < len1; i++)
    {
        fname[len1 + i] = lname[i];
    }

    printf("%s ", fname);
}

