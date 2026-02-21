# Generated manually by merging migrations on 2026-02-21

import api.room.models
import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("room", "0002_alter_room_end_datetime_alter_room_recurrence_rule_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="room",
            name="amenities",
            field=models.ManyToManyField(blank=True, to="room.amenity"),
        ),
        migrations.AlterField(
            model_name="room",
            name="capacity",
            field=models.PositiveIntegerField(
                blank=True,
                null=True,
                validators=[django.core.validators.MinValueValidator(1)],
            ),
        ),
        migrations.AlterField(
            model_name="room",
            name="start_datetime",
            field=models.DateTimeField(
                blank=True, default=api.room.models.get_start_of_today
            ),
        ),
        migrations.AlterField(
            model_name="room",
            name="end_datetime",
            field=models.DateTimeField(
                blank=True, default=api.room.models.get_end_of_today
            ),
        ),
        migrations.AlterField(
            model_name="room",
            name="recurrence_rule",
            field=models.CharField(blank=True, default="FREQ=DAILY", max_length=64),
        )
    ]
