#include <stdio.h>

void main()
{
    int a = 10 , b = 6, x= 10,  c, y, d, z, f = 5;

    c = x << 2; 
    d = y >> 2 ;
    z = ~f;

    printf("%d\n", a&b && b+1 || 0); 

    printf("%d\n", c); //40

    printf("%d\n", d); //  12
    printf("%d\n", z); //  -6


}