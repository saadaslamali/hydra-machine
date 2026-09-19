/*********************************************************
This is a library for the MPR121 12-channel Capacitive touch sensor

Designed specifically to work with the MPR121 Breakout in the Adafruit shop
  ----> https://www.adafruit.com/products/

These sensors use I2C communicate, at least 2 pins are required
to interface

Adafruit invests time and resources providing this open source code,
please support Adafruit and open-source hardware by purchasing
products from Adafruit!

Written by Limor Fried/Ladyada for Adafruit Industries.
BSD license, all text above must be included in any redistribution
**********************************************************/

#include <Wire.h>
#include "Adafruit_MPR121.h"

#ifndef _BV
#define _BV(bit) (1 << (bit))
#endif


Adafruit_MPR121 cap = Adafruit_MPR121();


uint16_t lasttouched = 0;
uint16_t currtouched = 0;

int8_t modifierPin = -1;
uint8_t tapSequence[2]; 
uint8_t sequenceLength = 0;

const char pinToLetter[12] = {'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'};


void setup() {
  Serial.begin(9600);



  while (!Serial) { 
    delay(10);
  }

  // Serial.println("Adafruit MPR121 Capacitive Touch sensor test");


  if (!cap.begin(0x5A)) {
    // Serial.println("MPR121 not found, check wiring?");
    while (1);
  }
  // Serial.println("MPR121 found!");

  // Serial.println("Running auto configuration.");
  cap.setAutoconfig(true);

  // Serial.println("Initialization complete.");
}

void loop() {

  currtouched = cap.touched();

  if (modifierPin == -1) {
    //if the shift pin isnt held, wait for it to be
    for (uint8_t i = 0; i < 12; i++) {

      if ((currtouched & _BV(i)) && !(lasttouched & _BV(i))) {

        modifierPin = i;
        sequenceLength = 0; 
        tapSequence[sequenceLength] = i; 
        sequenceLength++;
        break; 
      }
    }
  }

 else {
    //if the modifier pin is let go
    if (!(currtouched & _BV(modifierPin)) && (lasttouched & _BV(modifierPin))) {
/*
      for (uint8_t i = 0; i < sequenceLength; i++) {
        Serial.print(pinToLetter[tapSequence[i]]);
      }
      Serial.println();  
*/
      modifierPin = -1;
    }

    else {
      for (uint8_t i = 0; i < 12; i++) {
        if (i == modifierPin) continue;
        
        if ((currtouched & _BV(i)) && !(lasttouched & _BV(i))) {
          if (sequenceLength < 2) {
            tapSequence[sequenceLength] = i;
            sequenceLength++;
                    // Serial.print(pinToLetter[tapSequence[i]]);

          }
          else {
        for (uint8_t i = 0; i < sequenceLength; i++) {
        Serial.print(pinToLetter[tapSequence[i]]);
      }
          }
                              // Serial.print(pinToLetter[tapSequence[i]]);

        }
      }
    }
  }


  // reset our state
  lasttouched = currtouched;

  delay(10);


}
