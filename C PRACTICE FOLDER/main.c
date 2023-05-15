#include <stdio.h>
#include <conio.h>

// void display(int n)
// {
//     if (n < 1) return;
//     else
//     {
//         printf("%d", n);
//         display(n-1);
//         printf("%d", n);
//     }
// }

// void main(){       //a frame allocated to main. 
 
//     int n = 3;
//     display(n);
// }

// int sum (int x)
// {
//     int s = 0;
//     if (x == 1)
//     return x;
//     s = x + sum(x-1);
//     return s;
// }
// void main()
// {
//     int a;
//     a = sum(4);
//     printf("%d", a);
// }

// int fact (int);  

// int main()  
// {  
//     int n,f;  
//     // printf("Enter the number whose factorial you want to calculate?");  
//     // scanf("%d",&n);  
//     f = fact(4);  
//     printf("factorial = %d",f);  
// }  


// int fact(int n)  
// {  
//     if (n==0)  
//     {  
//         return 0;  
//     }  
//     else if ( n == 1)  
//     {  
//         return 1;  
//     }  
//     else   
//     {  
//         return n*fact(n-1);  
//     }  
// }  


// void print(int nb)
// {
//     printf("%d", nb);
//     nb --;
//     if (nb > 0) 
//     {
//         print(nb);
//     }
// }

// int main(void)
// {
//     print(2);
//     return (0);
// }

// void print(int nb)
// {
//     printf("%d", nb);
//     -- nb;
//     if (nb > 0) 
//     {
//         print(nb);
//     }
// }

// int main(void)
// {
//     print(4);
//     return (0);
// }

// void print(int nb)
// {
//     printf("%d", nb);
//     nb ++;
//     if (nb < 10) 
//     {
//         print(nb);
//     }
// }

// int main(void)
// {
//     print(4);
//     return (0);
// }

// void print(int nb)
// {
//     if (nb < 0) 
//     {
//         return;
//     }
//     printf("%d", nb);
//     nb --;
//     print(nb);
// }

// int main(void)
// {
//     print(4);
//     return (0);
// }

// int print(int nb)
// {
//     if (nb < 0) 
//     {
//         return (0);
//     }
//     printf("%d", nb + print(nb - 1));
//     nb --;
//     return (nb);
// }

// int main(void)
// {
//     print(4);
//     return (0);
// }

int main(void)
{
    
    // int a = 0;
    // int b = 1;
    // int c = -1, d;

    // d = --a * (5 + b) / 2 - c++ * b;
    // a = printf("Luqman"), 7, 9, 4;
    //printf("%d", d);
    // printf("%d", 2 + 3 * 2 * 2);
    // printf("%d", --b);
    // printf("%d", s--);
    //int a = 8, c;
    //int *p;  
    // p = &a;
    // *p = 30;
    // c = *p;
int a = 10, b=5;
int *p, *q;
p =&a;
q = &b;
int **ptr = p; 

    //printf("%d %x %x", a, p ,q);
    // printf("\nValue of a is: %d", a);
    printf("\nValue of a is: %d", ptr);
    // printf("\nAddress of a is: %x", &a);
    // printf("\nAddress of a is: %p", p);
    // printf("\nAddress of pointer p is: %p", &p);
    // printf("\nAddress of c is: %d", c);
    
    
    //printf("\nAddress of a is: %p", *p);




    return 0;
}
