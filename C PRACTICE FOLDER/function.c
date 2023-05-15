#include <stdio.h>
#include <stdarg.h>

/*Call by reference*/

// void add(int*, int*);

// void main()
// {
//     int a = 6, b = 8, sum = 0;

//     add(&a, &b);

//     printf("a=%d, b=%d", a, b);
// }

// void add(int* a, int* b)
// {
    
//     *a = 4;
//      *b = 9;

//     //sum = a + b;

//     printf("a=%d, b=%d", *a, *b);

//     printf("\n");

// }

/*function with no argument and no return type*/

// void arith();

// void main()
// {
//     arith();
// }

// void arith(void)
// {  
//     int a, b, add = 0, mult = 0, sub = 0, div = 0, power = 0;

//     printf("Enter numbers: ");
//     scanf("%d %d", &a, &b);

//     add = a + b;
//     sub = a - b;
//     mult = a * b;
//     div = a / b;
//     power = a % b;

//     printf(" Addition = %d\n", add);
//     printf("Substration = %d\n", sub);
//     printf("Multiplication = %d\n", mult);
//     printf("Division = %d\n", div);
//     printf("Power of = %d\n", power);
// }

/*function with no argument but with return type*/

// int math();

// int main()
// {
//     int s;
//     s = math();
//     printf(" total = %d\n", s);
// }

// int math(void)
// {
//     int a, b, sum = 0;

//     printf("Enter numbers: ");
//     scanf("%d %d", &a, &b);

//     //sum = a * b;

//     //return sum;
//         //or
         
//     return a * b;
// }


/*Variadic Function*/

// int aver(int n, ...);

// int main()
// {
//     int s = aver(5, 8, 4, 3, 6,2);
//     printf("%d", s);
// }
// int aver(int n, ...)
// {
//     int sum = 0;
//     int i;
   
//     va_list list;
//     va_start(list, n);
//     for (i = 0; i < n; i++)
//     {
//     sum += va_arg(list, int);
//     }
//     va_end(list);
//     return sum%2;
// }


/*function with argument without return type*/
    
    // void sum(float, float);

    // void main(void)
    // {
    //     float x, y;
    // printf("Enter two float numbers");
       
    //    scanf("%f %f", &x, &y);
       
    //     sum(x, y);
    // }
    // void sum(float a, float b)
    // {
    //     float sum = 0; 
    //     sum = a + b;
    // printf("sum= %f", sum);

    // }



/*function with one argument without return type*/
/**
 * _func_check - to check even or odd num
 * Return: Nothing;
*/

// void _func_check(int a);
// void main(){
//     int b;
//     printf("Enter a number: ");
//     scanf("%d", &b);
//     _func_check(b);
// }

// void _func_check(int a)
// {
//     if (a % 2 == 0)
//     printf("Number is even");
//     else
//     printf("Number is odd");    
// }

/*Gate Function Test*/

// int jumble(int x, int y)
// {
//     x = 2 * x + y;
//     return x;
// }

// int main()
// {
//     int x = 2, y = 5;
//     y = jumble(y, x);
//     x = jumble(y, x);

//     printf("%d\n", x);

//     return 0;  // Ans=  26

// }

/*Passing Array to function*/

int avg(int marks[], int);

void main(){
    int marks[5] = {32, 33, 54, 65, 33}, size, average;

    //calculate size of array
    size = sizeof(marks)/sizeof(marks[0]);
    average = avg(marks, size);

    
printf("size is marks:%d\n", sizeof(marks));
printf("size is marks[0]:%d\n", sizeof(marks[0]));
printf("average=:%d\n", size);

printf("average=:%d", average);
     
}

//defining the function
int avg(int marks1[], int size)
{
    int sum = 0, total_average, i;

    for ( i = 0; i < size; i++)
    {
        sum = sum + marks1[i];
    }
    total_average = sum/size;
     return total_average;
}
