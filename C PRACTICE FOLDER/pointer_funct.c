#include <stdio.h>

// int sum(int, int);

// void main()
// {
//     //sum(8, 8);
//     int s = 0;
//     int d = 0;

//     int (*ptr) (int, int) = &sum;

//     // function call
//     s = (*ptr) (4, 6); 
//     d = ptr (4, 5 );
//     printf("value of func: %d\n", d);
//     printf("value of func: %d\n", s);

//     //printf("value of func: %d\  n", &ptr);



// }

// int sum(int a, int b)
// {
//     // int sum = 0;
//     // sum = a + b;

//     //  printf("sum is: %d\n", sum);
//     return a + b;
// }

void sub(int a, int b){ 
    printf("sub value is: %d\n", a - b);
    }
    void add(int a, int b){ 
    printf("add value is: %d\n", a + b);
    }
    void div(int a, int b){ 
    printf("div value is: %d\n", a / b);
    }
    void mul(int a, int b){ 
    printf("sub value is: %d\n", a*b);
    }

    int main() 
    {
        int ch, a, b; 
        int (*fptr[10])(int, int) = {sub, add, div, mul};
    scanf("%d %d", &a, &b);

        (*fptr[10]);
    }