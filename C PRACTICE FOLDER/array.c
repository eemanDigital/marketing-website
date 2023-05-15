#include <stdio.h>
#include<string.h>
//#define SIZE 5
void main()
{
/*

//HOW TO FIND LOWEST ELEMENT IN ARRAY
int arr[SIZE], i, large;
    

    
    for (i = 0; i < SIZE; i++)
    {
    
    printf("Enter numbers");
    scanf("%d", &arr[i]);
       
        
    }

    large = arr[0];
    for (i = 1; i < SIZE; i++)
        if (arr[1] <  large)

        {
            large = arr[i]; 
            printf("%d", large);
        }


*/


				//2D array
/*	int arr[3][4]= {{2,3,4,6},{5,4,3,32}, {54,33,66,4}};

	int i,j;

	for(i=0;i<3;i++)
	{
		for(j=0;j<4;j++)
		{
				printf("MY 2D Dimentional Arr:%d\n", arr[i][j]);
		}
	}*/

		//REVERSING AN ARRAY
/*
	int arr[10]= {23,45,32,54,34,67,38,43,78,76};
	int i;

	for(i=9; i>=0; i--)
	{
			printf("\nNumber reversed:%d", arr[i]);
	}

*/


		//CHECKKING FOR REPEATED NUMBERS

	int arr[9] = {3,4,5,6,3,5,7,8,2};

	int i;

	for (i = 0; i <= 8; i++)
	{

		int count = arr[0];
		if(count++ == arr[i])	
			
			printf("%d", count);
	}
	



}
