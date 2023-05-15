#include<stdio.h>
#include<stdlib.h>

void m(int n0, int n1, int n2)
{
    int *t;
    int sum; 

    t = malloc(sizeof(*t) * 3);
    t[0] = n0;
    t[1] = n1;
    t[2] = n2;
    sum = t[0] + t[1] + t[2];

    printf("%d +%d + %d = %d\n", t[0], t[1], t[2], sum);
}

int main()
{
    m(98, 402, -1024);
return (0);
//     int n, i, *ptr;

//     printf("Please enter a value: ");
//     scanf("%d", &n);

// ptr = (int*) malloc(n*sizeof(int));
// printf("\nEnter the values:");

//  for(i = 0; i < n; i++)
//  {
//     scanf("%d", (ptr + i));
//  } 

// printf("\nEntered values are:");
//  for(i = 0; i < n; i++)
// {
//     printf("%d\t", *(ptr + i));  

// }
// free(ptr); 

}